import { StrokeShape } from './types'

export interface VectorizedDrawing {
  isLineDrawing: boolean
  strokeRatio: number
  shapes: StrokeShape[]
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
}

/**
 * Extracts vector contours directly from raw BGRA image pixels of a drawing, sketch, or logo.
 * Produces smooth, normalized polylines on the 100x100 grid.
 */
export class ContourVectorizer {
  /**
   * Evaluates if an image contains high-contrast line strokes and extracts vector shapes.
   */
  public static vectorizeBitmap(
    bitmap: Buffer,
    width: number,
    height: number,
    epsilon: number = 3.2
  ): VectorizedDrawing | null {
    if (!bitmap || width <= 10 || height <= 10) return null

    const totalPixels = width * height
    const grid: Uint8Array = new Uint8Array(totalPixels)

    // Detect background brightness by sampling outer border pixels
    let borderLumSum = 0
    let borderCount = 0
    const stepX = Math.max(1, Math.floor(width / 30))
    const stepY = Math.max(1, Math.floor(height / 30))

    for (let x = 0; x < width; x += stepX) {
      const topIdx = (0 * width + x) * 4
      borderLumSum += 0.299 * bitmap[topIdx + 2] + 0.587 * bitmap[topIdx + 1] + 0.114 * bitmap[topIdx]
      const botIdx = ((height - 1) * width + x) * 4
      borderLumSum += 0.299 * bitmap[botIdx + 2] + 0.587 * bitmap[botIdx + 1] + 0.114 * bitmap[botIdx]
      borderCount += 2
    }
    for (let y = 0; y < height; y += stepY) {
      const leftIdx = (y * width + 0) * 4
      borderLumSum += 0.299 * bitmap[leftIdx + 2] + 0.587 * bitmap[leftIdx + 1] + 0.114 * bitmap[leftIdx]
      const rightIdx = (y * width + (width - 1)) * 4
      borderLumSum += 0.299 * bitmap[rightIdx + 2] + 0.587 * bitmap[rightIdx + 1] + 0.114 * bitmap[rightIdx]
      borderCount += 2
    }

    const isLightBg = borderCount > 0 ? borderLumSum / borderCount > 128 : true
    let strokeCount = 0

    // Mark stroke pixels based on contrast against background
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        const b = bitmap[idx]
        const g = bitmap[idx + 1]
        const r = bitmap[idx + 2]
        const a = bitmap[idx + 3]

        const lum = 0.299 * r + 0.587 * g + 0.114 * b
        const isStroke = isLightBg ? (a >= 50 && lum < 145) : (a >= 50 && lum > 110)

        if (isStroke) {
          grid[y * width + x] = 1
          strokeCount++
        }
      }
    }

    const strokeRatio = strokeCount / totalPixels
    // Line drawings/sketches typically have 0.1% to 35% stroke pixels
    if (strokeRatio < 0.001 || strokeRatio > 0.40) {
      return { isLineDrawing: false, strokeRatio, shapes: [], bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 } }
    }

    // bfs Connected Components
    const visited = new Uint8Array(totalPixels)
    const components: { points: [number, number][]; minX: number; maxX: number; minY: number; maxY: number }[] = []

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pIdx = y * width + x
        if (grid[pIdx] === 1 && visited[pIdx] === 0) {
          const compPoints: [number, number][] = []
          const queue: [number, number][] = [[x, y]]
          visited[pIdx] = 1

          let cMinX = x
          let cMaxX = x
          let cMinY = y
          let cMaxY = y

          let head = 0
          while (head < queue.length) {
            const [cx, cy] = queue[head++]
            compPoints.push([cx, cy])

            if (cx < cMinX) cMinX = cx
            if (cx > cMaxX) cMaxX = cx
            if (cy < cMinY) cMinY = cy
            if (cy > cMaxY) cMaxY = cy

            // 8-neighborhood
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue
                const nx = cx + dx
                const ny = cy + dy
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const nIdx = ny * width + nx
                  if (grid[nIdx] === 1 && visited[nIdx] === 0) {
                    visited[nIdx] = 1
                    queue.push([nx, ny])
                  }
                }
              }
            }
          }

          // Filter out tiny noise specks (< 20 pixels)
          if (compPoints.length >= 20) {
            components.push({
              points: compPoints,
              minX: cMinX,
              maxX: cMaxX,
              minY: cMinY,
              maxY: cMaxY
            })
          }
        }
      }
    }

    if (components.length === 0) {
      return { isLineDrawing: false, strokeRatio, shapes: [], bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 } }
    }

    // Sort components by size descending
    components.sort((a, b) => b.points.length - a.points.length)

    // Select top major components (up to 6)
    const selectedComps = components.slice(0, 6)
    let globalMinX = width
    let globalMaxX = 0
    let globalMinY = height
    let globalMaxY = 0

    for (const comp of selectedComps) {
      if (comp.minX < globalMinX) globalMinX = comp.minX
      if (comp.maxX > globalMaxX) globalMaxX = comp.maxX
      if (comp.minY < globalMinY) globalMinY = comp.minY
      if (comp.maxY > globalMaxY) globalMaxY = comp.maxY
    }

    const boxW = Math.max(1, globalMaxX - globalMinX)
    const boxH = Math.max(1, globalMaxY - globalMinY)

    // Target grid 100x100: scale to fit inside [12, 88] x [12, 88]
    const targetSpan = 74.0
    const scale = Math.min(targetSpan / boxW, targetSpan / boxH)
    const offX = 50.0 - (boxW * scale) / 2.0
    const offY = 50.0 - (boxH * scale) / 2.0

    const shapes: StrokeShape[] = []

    // 8-direction vectors for Moore-Neighbor tracing
    const DIRS: [number, number][] = [
      [0, -1], [1, -1], [1, 0], [1, 1],
      [0, 1], [-1, 1], [-1, 0], [-1, -1]
    ]

    for (const comp of selectedComps) {
      const compSet = new Set<number>()
      for (const [px, py] of comp.points) {
        compSet.add(py * width + px)
      }

      // Find top-leftmost starting pixel
      let startX = comp.points[0][0]
      let startY = comp.points[0][1]
      for (const [px, py] of comp.points) {
        if (py < startY || (py === startY && px < startX)) {
          startX = px
          startY = py
        }
      }

      // Moore-Neighbor border tracing
      const rawContour: [number, number][] = [[startX, startY]]
      let currX = startX
      let currY = startY
      let startD = 0

      for (let step = 0; step < 4000; step++) {
        let found = false
        for (let i = 0; i < 8; i++) {
          const checkIdx = (startD + i) % 8
          const nx = currX + DIRS[checkIdx][0]
          const ny = currY + DIRS[checkIdx][1]
          if (nx >= 0 && nx < width && ny >= 0 && ny < height && compSet.has(ny * width + nx)) {
            currX = nx
            currY = ny
            rawContour.push([currX, currY])
            startD = (checkIdx + 5) % 8
            found = true
            break
          }
        }
        if (!found || (currX === startX && currY === startY && step > 6)) {
          break
        }
      }

      if (rawContour.length < 5) continue

      // Ramer-Douglas-Peucker simplification
      const simplified = this.rdp(rawContour, epsilon)
      if (simplified.length < 3) continue

      // Map to normalized 100x100
      const normPoints: [number, number][] = simplified.map(([px, py]) => [
        Math.round((offX + (px - globalMinX) * scale) * 10) / 10,
        Math.round((offY + (py - globalMinY) * scale) * 10) / 10
      ])

      shapes.push({
        type: 'polyline',
        points: normPoints,
        closed: true
      })
    }

    return {
      isLineDrawing: shapes.length > 0,
      strokeRatio,
      shapes,
      bounds: { minX: globalMinX, maxX: globalMaxX, minY: globalMinY, maxY: globalMaxY }
    }
  }

  private static rdp(pts: [number, number][], epsilon: number): [number, number][] {
    if (pts.length < 3) return pts

    let dmax = 0
    let index = 0
    const end = pts.length - 1

    for (let i = 1; i < end; i++) {
      const d = this.perpendicularDistance(pts[i], pts[0], pts[end])
      if (d > dmax) {
        index = i
        dmax = d
      }
    }

    if (dmax > epsilon) {
      const rec1 = this.rdp(pts.slice(0, index + 1), epsilon)
      const rec2 = this.rdp(pts.slice(index), epsilon)
      return rec1.slice(0, -1).concat(rec2)
    } else {
      return [pts[0], pts[end]]
    }
  }

  private static perpendicularDistance(
    pt: [number, number],
    lineStart: [number, number],
    lineEnd: [number, number]
  ): number {
    const dx = lineEnd[0] - lineStart[0]
    const dy = lineEnd[1] - lineStart[1]
    const mag = Math.hypot(dx, dy)
    if (mag === 0) return Math.hypot(pt[0] - lineStart[0], pt[1] - lineStart[1])

    const num = Math.abs(dy * pt[0] - dx * pt[1] + lineEnd[0] * lineStart[1] - lineEnd[1] * lineStart[0])
    return num / mag
  }
}
