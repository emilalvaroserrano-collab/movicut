const VIDEO = /\.(mp4|m4v|webm|mov|mkv)$/i;

type WtFile = {
  name: string;
  length: number;
  select: (priority?: number) => void;
  deselect: () => void;
  stream: () => ReadableStream<Uint8Array>;
};

type WtTorrent = {
  files: WtFile[];
  on: (event: string, fn: (err?: Error) => void) => void;
};

type WtClient = {
  add: (magnet: string, opts: { destroyStoreOnDestroy: boolean }, cb: (torrent: WtTorrent) => void) => WtTorrent;
  on: (event: string, fn: (err?: Error) => void) => void;
  destroy: (cb?: () => void) => void;
};

export function parseMagnet(raw: string): string | null {
  const text = raw.trim();
  if (!/^magnet:\?/i.test(text)) return null;
  if (!/xt=urn:bt[im]h:[a-z0-9]+/i.test(text)) return null;
  return text;
}

function hint(magnet: string): string {
  const match = magnet.match(/btih:([a-z0-9]+)/i) ?? magnet.match(/btmh:([a-z0-9]+)/i);
  return (match?.[1] ?? "movie").slice(0, 12).toLowerCase();
}

async function storeStream(
  name: string,
  storageName: string,
  stream: ReadableStream<Uint8Array>,
  length: number,
  onProgress: (ratio: number, label: string) => void,
  signal: AbortSignal,
): Promise<File> {
  const root = await navigator.storage?.getDirectory?.();
  if (!root) {
    if (length > 350 * 1024 * 1024) {
      throw new Error("This browser can't store a movie that large from a magnet. Open the file from this device instead.");
    }
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();
    let got = 0;
    while (true) {
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(new Uint8Array(value));
      got += value.byteLength;
      onProgress(Math.min(0.99, got / Math.max(1, length)), `Fetching ${name}`);
    }
    return new File(chunks as BlobPart[], name, { type: "video/mp4" });
  }

  await navigator.storage?.persist?.().catch(() => undefined);
  const safe = storageName.replace(/[^\w.\- ]+/g, "_").slice(-80);
  const handle = await root.getFileHandle(safe, { create: true });
  const writable = await handle.createWritable();
  const reader = stream.getReader();
  let got = 0;
  try {
    while (true) {
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      const { done, value } = await reader.read();
      if (done) break;
      const copy = new Uint8Array(value.byteLength);
      copy.set(value);
      await writable.write(new Blob([copy]));
      got += value.byteLength;
      onProgress(Math.min(0.99, got / Math.max(1, length)), `Fetching ${name}`);
    }
    await writable.close();
  } catch (err) {
    await writable.abort?.().catch(() => undefined);
    throw err;
  }
  return handle.getFile();
}

export async function fileFromMagnet(
  magnet: string,
  onProgress: (ratio: number, label: string) => void,
  signal: AbortSignal,
): Promise<File> {
  if (typeof window === "undefined") throw new Error("A magnet can only be opened in the browser.");
  onProgress(0.02, "Looking for peers");
  const { default: WebTorrent } = await import("webtorrent/dist/webtorrent.min.js");
  const client = new WebTorrent() as unknown as WtClient;
  let settled = false;

  const torrent = await new Promise<WtTorrent>((resolve, reject) => {
    const fail = (err?: Error) => {
      if (settled) return;
      settled = true;
      reject(err instanceof Error ? err : new Error("The magnet couldn't be opened."));
    };
    const timer = window.setTimeout(() => fail(new Error("No peers answered. Check the magnet link and try again.")), 60_000);
    signal.addEventListener("abort", () => {
      window.clearTimeout(timer);
      fail(new DOMException("Aborted", "AbortError"));
    });
    client.on("error", fail);
    try {
      const added = client.add(magnet, { destroyStoreOnDestroy: true }, (ready) => {
        window.clearTimeout(timer);
        if (settled) return;
        settled = true;
        resolve(ready);
      });
      added.on("error", fail);
    } catch (err) {
      window.clearTimeout(timer);
      fail(err instanceof Error ? err : new Error("That magnet link isn't usable."));
    }
  }).catch((err: unknown) => {
    client.destroy();
    throw err;
  });

  try {
    const video = torrent.files
      .filter((file) => VIDEO.test(file.name))
      .sort((a, b) => b.length - a.length)[0];
    if (!video) throw new Error("That torrent has no movie file.");
    for (const file of torrent.files) {
      if (file !== video) file.deselect();
    }
    video.select(1);
    onProgress(0.04, `Fetching ${video.name}`);
    return await storeStream(
      video.name,
      `${hint(magnet)}-${video.name}`,
      video.stream(),
      video.length,
      onProgress,
      signal,
    );
  } finally {
    client.destroy();
  }
}
