import { SHMETRO_LINE_COLORS } from '@kyuri-metro/shmetro-palette'

export type LineIdBlockProps = {
  background?: string
  foreground?: string
  height?: number
  lineNumber: string | number
}

type TextMeasure = {
  actualBoundingBoxAscent: number
  actualBoundingBoxDescent: number
  actualBoundingBoxLeft: number
  actualBoundingBoxRight: number
}

type TextLayout = {
  x: number
  y: number
  fontSize: number
  letterSpacing?: number
  transform?: string
}

type BadgeLayout = {
  width: number
  height: number
  text: string
  textLayout: TextLayout
}

const FALLBACK_BACKGROUND = '#666666'
const FALLBACK_FOREGROUND = '#000000'

function parseLineNumber(lineNumber: string | number) {
  const lineString = String(lineNumber).trim()

  if (!/^\d{1,2}$/.test(lineString)) {
    return null
  }

  const lineId = Number(lineString)

  if (!Number.isInteger(lineId) || lineId < 0 || lineId > 99) {
    return null
  }

  return {
    lineId,
    lineString,
  }
}

function getBadgePalette(lineNumber: string | number, foreground?: string, background?: string) {
  const parsed = parseLineNumber(lineNumber)
  const metroPalette = parsed ? SHMETRO_LINE_COLORS[parsed.lineId] : undefined

  return {
    background: background ?? metroPalette?.background ?? FALLBACK_BACKGROUND,
    foreground: foreground ?? metroPalette?.foreground ?? FALLBACK_FOREGROUND,
  }
}

function measureText(lineString: string, fontSize: number): TextMeasure {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Failed to create canvas context')
  }

  context.font = `${fontSize}px Arial`

  const metrics = context.measureText(lineString)

  return {
    actualBoundingBoxAscent: metrics.actualBoundingBoxAscent,
    actualBoundingBoxDescent: metrics.actualBoundingBoxDescent,
    actualBoundingBoxLeft: metrics.actualBoundingBoxLeft,
    actualBoundingBoxRight: metrics.actualBoundingBoxRight,
  }
}

function scaleLayout(layout: BadgeLayout, nextHeight: number): BadgeLayout {
  if (layout.height === nextHeight) {
    return layout
  }

  const scale = nextHeight / layout.height

  return {
    width: layout.width * scale,
    height: nextHeight,
    text: layout.text,
    textLayout: {
      x: layout.textLayout.x * scale,
      y: layout.textLayout.y * scale,
      fontSize: layout.textLayout.fontSize * scale,
      letterSpacing:
        layout.textLayout.letterSpacing === undefined ? undefined : layout.textLayout.letterSpacing * scale,
      transform: layout.textLayout.transform,
    },
  }
}

function getBaseLayout(lineId: number, lineString: string): BadgeLayout {
  const height = 100
  const isSingleDigit = lineId < 10
  const width = isSingleDigit ? 85 : 100
  const fontSize = height * 0.9
  const widthScale = lineId >= 20 && lineId % 10 !== 1 ? 0.9 : 1
  const measured = measureText(lineString, fontSize)
  const realWidth = measured.actualBoundingBoxRight + measured.actualBoundingBoxLeft
  const expectedWidth = lineId === 11 ? 65 : lineId >= 20 && lineId % 10 === 1 ? 74 : 81
  const scaledExpectedWidth = expectedWidth / widthScale
  const letterSpacing =
    lineString.length > 1 ? (scaledExpectedWidth - realWidth) / (lineString.length - 1) : 0
  const totalLetterSpacing = letterSpacing * Math.max(0, lineString.length - 1)
  const centerX = lineId === 11 ? width * 0.49 : width / 2
  const centerY = height / 2
  const x =
    centerX / widthScale -
    (measured.actualBoundingBoxRight + totalLetterSpacing - measured.actualBoundingBoxLeft) / 2
  const y = centerY + (measured.actualBoundingBoxAscent - measured.actualBoundingBoxDescent) / 2

  return {
    width,
    height,
    text: lineString,
    textLayout: {
      x,
      y,
      fontSize,
      letterSpacing,
      transform: widthScale === 1 ? undefined : `scale(${widthScale} 1)`,
    },
  }
}

function formatLetterSpacing(letterSpacing?: number) {
  if (letterSpacing === undefined) {
    return ''
  }

  return ` letter-spacing="${letterSpacing}px"`
}

function formatTransform(transform?: string) {
  if (!transform) {
    return ''
  }

  return ` transform="${transform}"`
}

export function generateLineIdBlock2025Svg({ background, foreground, height = 100, lineNumber }: LineIdBlockProps) {
  const parsed = parseLineNumber(lineNumber)

  if (!parsed) {
    return ''
  }

  const palette = getBadgePalette(lineNumber, foreground, background)
  const layout = scaleLayout(getBaseLayout(parsed.lineId, parsed.lineString), height)

  return `<svg width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${layout.width}" height="${layout.height}" fill="${palette.background}"/><text x="${layout.textLayout.x}" y="${layout.textLayout.y}" fill="${palette.foreground}" font-family="Arial" font-size="${layout.textLayout.fontSize}px"${formatLetterSpacing(layout.textLayout.letterSpacing)}${formatTransform(layout.textLayout.transform)}>${layout.text}</text></svg>`
}