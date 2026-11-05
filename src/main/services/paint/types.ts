export type Point2D = [number, number]

export interface LineShape {
  type: 'line'
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface PolylineShape {
  type: 'polyline'
  points: Point2D[]
  closed?: boolean
}

export interface CircleShape {
  type: 'circle'
  cx: number
  cy: number
  r: number
}

export interface EllipseShape {
  type: 'ellipse'
  cx: number
  cy: number
  rx: number
  ry: number
}

export interface ArcShape {
  type: 'arc'
  cx: number
  cy: number
  rx: number
  ry: number
  startAngle: number // degrees 0..360
  endAngle: number   // degrees 0..360
}

export interface CurveShape {
  type: 'curve'
  p0: Point2D
  p1: Point2D // control point
  p2: Point2D // end point (quadratic) or control point 2 (cubic)
  p3?: Point2D // end point if cubic
}

export type StrokeShape =
  | LineShape
  | PolylineShape
  | CircleShape
  | EllipseShape
  | ArcShape
  | CurveShape

export interface DrawingPlan {
  subject: string
  comment?: string
  shapes: StrokeShape[]
}

export interface ValidationResult {
  valid: boolean
  sanitizedPlan?: DrawingPlan
  errors?: string[]
}
