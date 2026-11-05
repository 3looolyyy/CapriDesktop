import { DrawingPlan, StrokeShape, ValidationResult, Point2D } from './types'

export const MAX_SHAPES_LIMIT = 25
export const MIN_SHAPES_LIMIT = 1

function clampCoord(n: any): number {
  const val = typeof n === 'number' ? n : parseFloat(n)
  if (isNaN(val) || !isFinite(val)) return 50
  const clamped = Math.max(0, Math.min(100, val))
  return Math.round(clamped * 10) / 10
}

function isValidPoint(pt: any): pt is Point2D {
  return (
    Array.isArray(pt) &&
    pt.length >= 2 &&
    typeof pt[0] === 'number' &&
    typeof pt[1] === 'number' &&
    !isNaN(pt[0]) &&
    !isNaN(pt[1]) &&
    isFinite(pt[0]) &&
    isFinite(pt[1])
  )
}

function sanitizePoint(pt: Point2D): Point2D {
  return [clampCoord(pt[0]), clampCoord(pt[1])]
}

export class StrokeValidator {
  public static validate(raw: any): ValidationResult {
    const errors: string[] = []

    if (!raw || typeof raw !== 'object') {
      return { valid: false, errors: ['El plan de dibujo debe ser un objeto JSON válido'] }
    }

    const subject = typeof raw.subject === 'string' && raw.subject.trim() ? raw.subject.trim() : 'dibujo'
    const comment = typeof raw.comment === 'string' ? raw.comment.trim() : undefined

    if (!Array.isArray(raw.shapes)) {
      return { valid: false, errors: ['El campo "shapes" debe ser un array de primitivas'] }
    }

    if (raw.shapes.length < MIN_SHAPES_LIMIT) {
      return { valid: false, errors: ['El plan debe contener al menos 1 forma para dibujar'] }
    }

    const rawShapes = raw.shapes.slice(0, MAX_SHAPES_LIMIT)
    const sanitizedShapes: StrokeShape[] = []

    for (let i = 0; i < rawShapes.length; i++) {
      const s = rawShapes[i]
      if (!s || typeof s !== 'object') {
        errors.push(`Forma #${i + 1} no es un objeto`)
        continue
      }

      const type = String(s.type || '').toLowerCase().trim()

      switch (type) {
        case 'line': {
          if (s.x1 === undefined || s.y1 === undefined || s.x2 === undefined || s.y2 === undefined) {
            errors.push(`Forma #${i + 1} (line) requiere x1, y1, x2, y2`)
            continue
          }
          sanitizedShapes.push({
            type: 'line',
            x1: clampCoord(s.x1),
            y1: clampCoord(s.y1),
            x2: clampCoord(s.x2),
            y2: clampCoord(s.y2)
          })
          break
        }

        case 'polyline': {
          if (!Array.isArray(s.points) || s.points.length < 2) {
            errors.push(`Forma #${i + 1} (polyline) debe tener un array "points" con al menos 2 puntos`)
            continue
          }
          const validPoints: Point2D[] = []
          for (const pt of s.points) {
            if (isValidPoint(pt)) {
              validPoints.push(sanitizePoint(pt))
            } else if (Array.isArray(pt) && pt.length >= 2) {
              validPoints.push([clampCoord(pt[0]), clampCoord(pt[1])])
            }
          }
          if (validPoints.length < 2) {
            errors.push(`Forma #${i + 1} (polyline) no tiene suficientes puntos válidos`)
            continue
          }
          sanitizedShapes.push({
            type: 'polyline',
            points: validPoints.slice(0, 30),
            closed: !!s.closed
          })
          break
        }

        case 'circle': {
          if (s.cx === undefined || s.cy === undefined || s.r === undefined) {
            errors.push(`Forma #${i + 1} (circle) requiere cx, cy, r`)
            continue
          }
          const r = clampCoord(s.r)
          if (r <= 0) {
            errors.push(`Forma #${i + 1} (circle) tiene radio <= 0`)
            continue
          }
          sanitizedShapes.push({
            type: 'circle',
            cx: clampCoord(s.cx),
            cy: clampCoord(s.cy),
            r: Math.min(50, Math.max(1, r))
          })
          break
        }

        case 'ellipse': {
          if (s.cx === undefined || s.cy === undefined || s.rx === undefined || s.ry === undefined) {
            errors.push(`Forma #${i + 1} (ellipse) requiere cx, cy, rx, ry`)
            continue
          }
          const rx = clampCoord(s.rx)
          const ry = clampCoord(s.ry)
          if (rx <= 0 || ry <= 0) {
            errors.push(`Forma #${i + 1} (ellipse) tiene radio inválido`)
            continue
          }
          sanitizedShapes.push({
            type: 'ellipse',
            cx: clampCoord(s.cx),
            cy: clampCoord(s.cy),
            rx: Math.min(50, Math.max(1, rx)),
            ry: Math.min(50, Math.max(1, ry))
          })
          break
        }

        case 'arc': {
          if (s.cx === undefined || s.cy === undefined || s.rx === undefined || s.ry === undefined) {
            errors.push(`Forma #${i + 1} (arc) requiere cx, cy, rx, ry`)
            continue
          }
          const rx = clampCoord(s.rx)
          const ry = clampCoord(s.ry)
          const startAngle = typeof s.startAngle === 'number' ? s.startAngle : parseFloat(s.startAngle) || 0
          const endAngle = typeof s.endAngle === 'number' ? s.endAngle : parseFloat(s.endAngle) || 180
          sanitizedShapes.push({
            type: 'arc',
            cx: clampCoord(s.cx),
            cy: clampCoord(s.cy),
            rx: Math.min(50, Math.max(1, rx)),
            ry: Math.min(50, Math.max(1, ry)),
            startAngle: ((startAngle % 360) + 360) % 360,
            endAngle: ((endAngle % 360) + 360) % 360
          })
          break
        }

        case 'curve': {
          if (!s.p0 || !s.p1 || !s.p2) {
            errors.push(`Forma #${i + 1} (curve) requiere p0, p1, p2`)
            continue
          }
          const p0 = sanitizePoint(s.p0)
          const p1 = sanitizePoint(s.p1)
          const p2 = sanitizePoint(s.p2)
          const p3 = s.p3 ? sanitizePoint(s.p3) : undefined
          sanitizedShapes.push({
            type: 'curve',
            p0,
            p1,
            p2,
            ...(p3 ? { p3 } : {})
          })
          break
        }

        default:
          errors.push(`Forma #${i + 1} tipo desconocido: "${type}"`)
          break
      }
    }

    if (sanitizedShapes.length === 0) {
      return {
        valid: false,
        errors: errors.length > 0 ? errors : ['No se pudieron extraer formas válidas del plan']
      }
    }

    return {
      valid: true,
      sanitizedPlan: {
        subject,
        comment,
        shapes: sanitizedShapes
      },
      errors: errors.length > 0 ? errors : undefined
    }
  }
}
