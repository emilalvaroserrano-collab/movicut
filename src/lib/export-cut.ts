export type ExportResult = {
  blob: Blob;
  extension: "mp4" | "webm";
  mimeType: string;
  converted: boolean;
};

export async function finalizeRecordedCut(
  recorded: Blob,
  onProgress?: (ratio: number) => void,
): Promise<ExportResult> {
  try {
    const {
      ALL_FORMATS,
      BlobSource,
      BufferTarget,
      Conversion,
      Input,
      Mp4OutputFormat,
      Output,
      Quality,
    } = await import("mediabunny");

    const input = new Input({
      source: new BlobSource(recorded),
      formats: ALL_FORMATS,
    });
    const target = new BufferTarget();
    const output = new Output({
      format: new Mp4OutputFormat({ fastStart: "in-memory" }),
      target,
    });

    const conversion = await Conversion.init({
      input,
      output,
      tracks: "primary",
      video: {
        codec: "avc",
        quality: new Quality("high"),
        frameRate: 30,
        keyFrameInterval: 2,
        forceTranscode: true,
        hardwareAcceleration: "prefer-hardware",
      },
      audio: {
        codec: "aac",
        sampleRate: 48_000,
        quality: new Quality("high"),
        forceTranscode: true,
      },
      showWarnings: false,
    });

    if (!conversion.isValid) {
      input.dispose();
      return {
        blob: recorded,
        extension: "webm",
        mimeType: recorded.type || "video/webm",
        converted: false,
      };
    }

    conversion.onProgress = (ratio) => onProgress?.(ratio);
    await conversion.execute();
    const buffer = target.buffer;
    input.dispose();

    if (!buffer || buffer.byteLength < 1024) {
      return {
        blob: recorded,
        extension: "webm",
        mimeType: recorded.type || "video/webm",
        converted: false,
      };
    }

    return {
      blob: new Blob([buffer], { type: "video/mp4" }),
      extension: "mp4",
      mimeType: "video/mp4",
      converted: true,
    };
  } catch {
    return {
      blob: recorded,
      extension: "webm",
      mimeType: recorded.type || "video/webm",
      converted: false,
    };
  }
}
