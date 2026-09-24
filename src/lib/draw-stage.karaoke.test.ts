import assert from "node:assert/strict";
import test from "node:test";
import { drawStage } from "./draw-stage.ts";

test("canvas karaoke renderer paints the active word yellow and inactive words ivory", () => {
  const painted: Array<{ text: string; fillStyle: unknown }> = [];
  const ctx = {
    clearRect() {},
    fillRect() {},
    save() {},
    restore() {},
    beginPath() {},
    rect() {},
    clip() {},
    drawImage() {},
    strokeText() {},
    fillText(text: string) {
      painted.push({ text, fillStyle: this.fillStyle });
    },
    measureText(text: string) {
      return { width: text.length * 20 };
    },
    fillStyle: "",
    strokeStyle: "",
    globalAlpha: 1,
    font: "",
    textBaseline: "middle",
    lineJoin: "round",
    miterLimit: 2,
    lineWidth: 1,
  } as unknown as CanvasRenderingContext2D;

  drawStage(
    ctx,
    720,
    1280,
    null,
    [],
    {
      words: [
        { text: "DON'T", hot: false },
        { text: "OPEN", hot: true },
        { text: "IT", hot: false },
      ],
      alpha: 1,
    },
  );

  assert.deepEqual(
    painted.map((row) => row.fillStyle),
    ["#f4efe4", "#ffe14a", "#f4efe4"],
  );
});
