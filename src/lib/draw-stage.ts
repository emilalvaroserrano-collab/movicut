export type PaintedWord = { text: string; hot: boolean };

const IVORY = "#f4efe4";
const YELLOW = "#ffe14a";
const INK = "#140f08";

export type StageSource = HTMLVideoElement | HTMLImageElement | null;

function sourceSize(source: StageSource): { w: number; h: number } | null {
  if (!source) return null;
  if (source instanceof HTMLVideoElement) {
    if (!source.videoWidth || !source.videoHeight) return null;
    return { w: source.videoWidth, h: source.videoHeight };
  }
  if (!source.complete || !source.naturalWidth) return null;
  return { w: source.naturalWidth, h: source.naturalHeight };
}

function drawWords(
  ctx: CanvasRenderingContext2D,
  words: PaintedWord[],
  cx: number,
  y: number,
  maxW: number,
  startSize: number,
  family: string,
  weight: string,
) {
  if (!words.length) return;
  const plain = words.map((w) => w.text).join(" ");
  let size = startSize;
  const setFont = () => {
    ctx.font = `${weight} ${size}px ${family}`;
  };
  setFont();
  while (size > 20 && ctx.measureText(plain).width > maxW) {
    size -= 2;
    setFont();
  }
  const space = ctx.measureText(" ").width;
  const widths = words.map((w) => ctx.measureText(w.text).width);
  const total = widths.reduce((a, b) => a + b, 0) + space * Math.max(0, words.length - 1);
  let x = cx - total / 2;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.lineWidth = Math.max(5, size / 5.5);
  ctx.strokeStyle = INK;
  for (let i = 0; i < words.length; i++) {
    ctx.strokeText(words[i].text, x, y);
    ctx.fillStyle = words[i].hot ? YELLOW : IVORY;
    ctx.fillText(words[i].text, x, y);
    x += widths[i] + space;
  }
}

function coverCrop(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sw: number,
  sh: number,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / sw, h / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(source, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

export function drawStage(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  source: StageSource,
  title: PaintedWord[][],
  caption: { words: PaintedWord[]; alpha: number } | null,
) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);

  const lines = title.slice(0, 2);
  const titleSize = Math.round(w * 0.112);
  const lineGap = titleSize * 1.02;
  const picH = Math.round(w * (9 / 16));
  const block = Math.max(lineGap, lines.length * lineGap);
  const spare = Math.max(0, h - picH - block - titleSize * 0.4);
  const top = spare * 0.34;
  const titleTop = top + titleSize * 0.72;
  const picY = titleTop + Math.max(0, lines.length - 1) * lineGap + titleSize * 0.62;
  const pic = { x: 0, y: picY, w, h: picH };

  const size = sourceSize(source);
  if (source && size) {
    coverCrop(ctx, source, size.w, size.h, pic.x, pic.y, pic.w, pic.h);
  }

  lines.forEach((line, i) => {
    drawWords(ctx, line, w / 2, titleTop + i * lineGap, w * 0.94, titleSize, "Anton", "400");
  });

  if (caption && caption.alpha > 0.02 && caption.words.length) {
    ctx.save();
    ctx.globalAlpha = caption.alpha;
    const cy = pic.y + pic.h + titleSize * 1.15;
    drawWords(ctx, caption.words, w / 2, cy, w * 0.9, Math.round(w * 0.055), '"DM Sans"', "800");
    ctx.restore();
  }
}
