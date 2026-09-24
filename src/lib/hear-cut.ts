import { transcribeClip, type HeardWord } from "@/lib/karaoke";

async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Couldn't pack that cut's audio."));
    reader.readAsDataURL(blob);
  });
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

export async function extractCutWav(file: File, start: number, end: number, isStale: () => boolean): Promise<Blob> {
  if (!(end > start + 0.4) || end - start > 70) throw new Error("That cut isn't a captionable length.");
  const { ALL_FORMATS, BlobSource, BufferTarget, Conversion, Input, Output, WavOutputFormat } = await import("mediabunny");
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const target = new BufferTarget();
  const output = new Output({ format: new WavOutputFormat(), target });
  let conversion: { cancel: () => void; execute: () => Promise<void>; isValid: boolean } | null = null;
  const watch = window.setInterval(() => {
    if (isStale()) conversion?.cancel();
  }, 250);
  try {
    conversion = await Conversion.init({
      input,
      output,
      showWarnings: false,
      tracks: "primary",
      video: { discard: true },
      audio: { codec: "pcm-s16", sampleRate: 16000, numberOfChannels: 1 },
      trim: { start, end },
    });
    if (isStale()) {
      conversion.cancel();
      throw new Error("stale");
    }
    if (!conversion.isValid) {
      throw new Error("This movie's audio can't be read here. Add an .srt, or paste the lines.");
    }
    await conversion.execute();
    if (isStale()) throw new Error("stale");
    const buffer = target.buffer;
    if (!buffer || buffer.byteLength < 1000) throw new Error("Couldn't hear enough of that cut.");
    return new Blob([buffer], { type: "audio/wav" });
  } catch (err) {
    if (isStale() || (err instanceof Error && err.message === "stale")) throw new Error("stale");
    if (err instanceof Error && /can't be read|captionable|hear enough/.test(err.message)) throw err;
    throw new Error("Couldn't pull the dialogue out of that cut. Add an .srt, or paste the lines.");
  } finally {
    window.clearInterval(watch);
    input.dispose();
  }
}

export async function transcribeWav(wav: Blob): Promise<HeardWord[]> {
  const wavBase64 = await blobToBase64(wav);
  const result = await transcribeClip({ data: { wavBase64 } });
  if (!result.ok) throw new Error(result.error);
  return result.words;
}
