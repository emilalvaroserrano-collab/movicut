import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Download, FolderOpen, Pause, Play, RotateCcw, Sparkles, Subtitles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClipCard } from "@/components/clip-card";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  analyzeMovie,
  parseTitle,
  pickCuts,
  plainTitle,
  refreshThumbs,
  seekTo,
  type Category,
  type Cut,
  type Sample,
} from "@/lib/analyze";
import { drawStage } from "@/lib/draw-stage";
import { BED_VOLUME, bedSrc } from "@/lib/bed";
import { fileFromMagnet, parseMagnet } from "@/lib/magnet";
import { DEMO_LOOP, DEMO_PHRASES, DEMO_TITLE } from "@/lib/demo";
import { formatBytes, formatSeconds, formatTimecode } from "@/lib/format";
import { cuesToPhrases, linesToCues, parseSubtitles, phraseAt, wordIndexAt, wordsToCues, type Cue, type Phrase } from "@/lib/subtitles";
import { extractCutWav, transcribeWav } from "@/lib/hear-cut";
import { cutsFromJudgement, judgeMoments } from "@/lib/identify";
import { hasMovieHandle, loadMovieHandle, loadProject, saveMovieHandle, saveProject } from "@/lib/storage";
import { finalizeRecordedCut } from "@/lib/export-cut";

const BLURB: Record<Category, string> = {
  epic: "The turn that makes the rest of the film make sense.",
  comedy: "The bit people quote when they retell it.",
  dialogue: "A line that still lands with the picture held still.",
  moral: "The lesson, said out loud or almost.",
  action: "The stretch you don't look away from.",
  revenge: "Payback, quiet or loud.",
};

type FileMeta = {
  name: string;
  size: number;
  duration: number;
  width: number;
  height: number;
};

type DeviceHandle = FileSystemFileHandle & {
  queryPermission?: (desc: { mode: "read" }) => Promise<PermissionState>;
  requestPermission?: (desc: { mode: "read" }) => Promise<PermissionState>;
};

type VideoWithCapture = HTMLVideoElement & {
  captureStream?: () => MediaStream;
};

type PickerWindow = Window & {
  showOpenFilePicker?: (opts: {
    multiple?: boolean;
    types?: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<FileSystemFileHandle[]>;
};

function signalsFrom(audio: boolean, subs: boolean): string[] {
  const list = ["Picture energy"];
  if (audio) list.push("Sound peaks");
  if (subs) list.push("Dialogue file");
  return list;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function windowKey(cut: { start: number; end: number }): string {
  return `${round2(cut.start)}-${round2(cut.end)}`;
}

function isUploadedSubs(name: string | null | undefined): boolean {
  return !!name && name !== "Heard from the cut" && name !== "Pasted lines";
}

function MagnetBar(props: {
  value: string;
  fetching: boolean;
  progress: number;
  label: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
}) {
  return (
    <form
      className="mt-4 grid gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        props.onSubmit();
      }}
    >
      <label className="grid gap-2 text-sm text-muted">
        <span>Magnet link. The movie downloads into this browser.</span>
        <span className="flex flex-col gap-2 sm:flex-row">
          <input
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder="magnet:?xt=urn:btih:…"
            spellCheck={false}
            autoCapitalize="off"
            disabled={props.disabled || props.fetching}
            className="min-h-11 min-w-0 flex-1 rounded-full bg-bg px-4 text-sm text-fg ring-1 ring-line outline-none focus:ring-pop"
          />
          {props.fetching ? (
            <Button type="button" variant="quiet" onClick={props.onStop}>
              Stop
            </Button>
          ) : (
            <Button type="submit" variant="quiet" disabled={props.disabled || !props.value.trim()}>
              Open magnet
            </Button>
          )}
        </span>
      </label>
      {props.fetching ? (
        <div>
          <div className="flex items-center justify-between gap-3 text-sm text-muted">
            <span className="truncate">{props.label}</span>
            <span className="tabular-nums">{Math.round(props.progress * 100)}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full bg-pop" style={{ width: `${Math.round(props.progress * 100)}%` }} />
          </div>
        </div>
      ) : null}
    </form>
  );
}

export function Studio() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bedRef = useRef<HTMLAudioElement | null>(null);
  const recordingRef = useRef(false);
  const titleFitRef = useRef<HTMLDivElement>(null);
  const [titleScale, setTitleScale] = useState(1);
  const movieInputRef = useRef<HTMLInputElement>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);
  const samplesRef = useRef<Sample[] | null>(null);
  const usedAudioRef = useRef(false);
  const demoModeRef = useRef(true);
  const demoPlayingRef = useRef(true);
  const playingRef = useRef(false);
  const activeCutRef = useRef<Cut | null>(null);
  const phrasesRef = useRef<Phrase[]>([]);
  const titleRef = useRef(DEMO_TITLE);
  const statusRef = useRef<"empty" | "loading" | "ready" | "scanning">("empty");
  const abortRef = useRef<AbortController | null>(null);
  const toggleRef = useRef<() => void>(() => {});
  const manualLockRef = useRef(false);
  const heardWindowRef = useRef<Map<string, string>>(new Map());
  const queueRef = useRef<Cut[]>([]);
  const pumpingRef = useRef(false);
  const inflightRef = useRef<string | null>(null);
  const hearGenRef = useRef(0);
  const pumpRef = useRef<() => void>(() => {});

  const [status, setStatus] = useState<"empty" | "loading" | "ready" | "scanning">("empty");
  const [error, setError] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [cues, setCues] = useState<Cue[]>([]);
  const [srtName, setSrtName] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [playing, setPlaying] = useState(true);
  const [now, setNow] = useState(0);
  const [liveLine, setLiveLine] = useState("");
  const [recording, setRecording] = useState(false);
  recordingRef.current = recording;
  const [remembered, setRemembered] = useState(false);
  const [canRerank, setCanRerank] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [magnet, setMagnet] = useState("");
  const [fetching, setFetching] = useState(false);
  const magnetAbortRef = useRef<AbortController | null>(null);
  const [signalList, setSignalList] = useState<string[]>(["Picture energy"]);
  const [lineDraft, setLineDraft] = useState("");
  const [demoStill, setDemoStill] = useState(0);
  const [hearingId, setHearingId] = useState<string | null>(null);
  const [silentIds, setSilentIds] = useState<string[]>([]);
  const [hearError, setHearError] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<number | null>(null);

  const phrases = useMemo(() => cuesToPhrases(cues), [cues]);
  const cuesRef = useRef(cues);
  cuesRef.current = cues;
  const cutsRef = useRef(cuts);
  cutsRef.current = cuts;
  const active = cuts.find((c) => c.id === activeId) ?? null;
  const longEnough = (fileMeta?.duration ?? 0) >= 50;

  activeCutRef.current = active;
  phrasesRef.current = phrases;
  demoModeRef.current = !fileMeta;
  statusRef.current = status;
  titleRef.current = active?.title ?? (fileMeta ? "YOUR MOVIE\nIS ON THE *TABLE*" : DEMO_TITLE);

  useEffect(() => {
    void hasMovieHandle().then(setRemembered);
  }, []);

  useEffect(() => {
    if (!fileMeta) return;
    saveProject({
      name: fileMeta.name,
      size: fileMeta.size,
      cuts,
      cues,
      srtName: srtName ?? undefined,
    });
  }, [fileMeta, cuts, cues, srtName]);

  useEffect(() => {
    const bed = bedRef.current ?? new Audio();
    bed.loop = true;
    bed.volume = BED_VOLUME;
    bedRef.current = bed;
    const src = bedSrc(active?.category);
    if (!bed.src.endsWith(src)) bed.src = src;
    const audible = playing && status !== "scanning" && !recording;
    if (audible) void bed.play().catch(() => undefined);
    else bed.pause();
  }, [playing, recording, status, active?.category]);

  useEffect(() => {
    const kick = () => {
      const bed = bedRef.current;
      if (!bed || recordingRef.current) return;
      if (playingRef.current || demoPlayingRef.current) void bed.play().catch(() => undefined);
    };
    window.addEventListener("pointerdown", kick);
    return () => window.removeEventListener("pointerdown", kick);
  }, []);

  useEffect(() => {
    setLineDraft("");
  }, [activeId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => {
      playingRef.current = true;
      setPlaying(true);
    };
    const onPause = () => {
      playingRef.current = false;
      setPlaying(false);
    };
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let demoElapsed = 0;
    let acc = 0;
    const loop = (ts: number) => {
      const dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      const video = videoRef.current;
      const film = !demoModeRef.current && !!video && video.readyState >= 2 && video.videoWidth > 0;
      if (!film && demoPlayingRef.current) demoElapsed += dt;
      const time = film && video ? video.currentTime : demoElapsed % DEMO_LOOP;
      if (film && video && playingRef.current) {
        const cut = activeCutRef.current;
        if (cut && video.currentTime >= cut.end - 0.04) video.pause();
      }
      acc += dt;
      if (acc > 0.08) {
        acc = 0;
        setNow(time);
        setDemoStill(Math.floor(demoElapsed / DEMO_LOOP) % 2);
        const script = film ? phrasesRef.current : DEMO_PHRASES;
        const phrase = phraseAt(script, time);
        setLiveLine(phrase ? phrase.words.map((w) => w.text).join(" ") : "");
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      toggleRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  toggleRef.current = () => {
    const video = videoRef.current;
    if (!fileMeta || !video || demoModeRef.current) {
      demoPlayingRef.current = !demoPlayingRef.current;
      setPlaying(demoPlayingRef.current);
      return;
    }
    if (!video.paused) {
      video.pause();
      return;
    }
    const cut = activeCutRef.current;
    if (cut && (video.currentTime < cut.start - 0.05 || video.currentTime >= cut.end - 0.12)) {
      video.currentTime = cut.start;
    }
    void video.play().catch(() => setError("Press play again to start the sound."));
  };

  function resetHearing() {
    hearGenRef.current += 1;
    queueRef.current = [];
    inflightRef.current = null;
    heardWindowRef.current = new Map();
    manualLockRef.current = false;
    setHearingId(null);
    setSilentIds([]);
    setHearError(null);
  }

  function enqueueKaraoke(list: Cut[], firstId?: string | null) {
    if (manualLockRef.current || !fileRef.current) return;
    const pending = list.filter(
      (cut) => heardWindowRef.current.get(cut.id) !== windowKey(cut) && inflightRef.current !== cut.id,
    );
    const extras = queueRef.current.filter(
      (cut) =>
        !pending.some((item) => item.id === cut.id) &&
        heardWindowRef.current.get(cut.id) !== windowKey(cut) &&
        inflightRef.current !== cut.id,
    );
    const merged = [...pending, ...extras];
    merged.sort((a, b) => (a.id === firstId ? -1 : b.id === firstId ? 1 : 0));
    queueRef.current = merged;
    pumpRef.current();
  }

  pumpRef.current = () => {
    void (async () => {
      if (pumpingRef.current) return;
      pumpingRef.current = true;
      const gen = hearGenRef.current;
      let failures = 0;
      try {
        while (queueRef.current.length && hearGenRef.current === gen && !manualLockRef.current) {
          const cut = queueRef.current.shift();
          if (!cut) break;
          const key = windowKey(cut);
          if (heardWindowRef.current.get(cut.id) === key) continue;
          const file = fileRef.current;
          if (!file) break;
          inflightRef.current = cut.id;
          setHearingId(cut.id);
          setHearError(null);
          try {
            const wav = await extractCutWav(file, cut.start, cut.end, () => hearGenRef.current !== gen);
            if (hearGenRef.current !== gen) return;
            const relative = await transcribeWav(wav);
            if (hearGenRef.current !== gen) return;
            const live = cutsRef.current.find((item) => item.id === cut.id);
            if (!live || windowKey(live) !== key) {
              if (live) queueRef.current.unshift(live);
              continue;
            }
            const absolute = relative
              .map((word) => ({
                text: word.text,
                start: cut.start + word.start,
                end: Math.min(cut.end, cut.start + word.end),
              }))
              .filter((word) => word.end > word.start + 0.03);
            const made = wordsToCues(absolute, cut.id);
            heardWindowRef.current.set(cut.id, key);
            failures = 0;
            if (!made.length) {
              setSilentIds((prev) => (prev.includes(cut.id) ? prev : [...prev, cut.id]));
            } else {
              setSilentIds((prev) => prev.filter((id) => id !== cut.id));
              const prevCues = cuesRef.current;
              const covered = prevCues.some(
                (cue) => cue.source !== "heard" && cue.end > cut.start + 0.3 && cue.start < cut.end - 0.3,
              );
              if (!covered && !manualLockRef.current) {
                const kept = prevCues.filter((cue) => !(cue.source === "heard" && cue.cutId === cut.id));
                const next = [...kept, ...made].sort((a, b) => a.start - b.start);
                cuesRef.current = next;
                setCues(next);
              }
              setSrtName((name) => (isUploadedSubs(name) ? name : "Heard from the cut"));
            }
          } catch (err) {
            if (err instanceof Error && err.message === "stale") return;
            const live = cutsRef.current.find((item) => item.id === cut.id);
            if (!live || windowKey(live) !== key) {
              if (live) queueRef.current.unshift(live);
              continue;
            }
            failures += 1;
            heardWindowRef.current.set(cut.id, key);
            setHearError(err instanceof Error ? err.message : "Karaoke couldn't be written.");
            if (failures >= 2) {
              queueRef.current = [];
              break;
            }
          } finally {
            if (inflightRef.current === cut.id) inflightRef.current = null;
          }
        }
      } finally {
        pumpingRef.current = false;
        setHearingId(null);
        if (queueRef.current.length && !manualLockRef.current) pumpRef.current();
      }
    })();
  };

  useEffect(() => {
    if (status !== "ready" || !fileMeta || !cuts.length) return;
    const timer = window.setTimeout(() => enqueueKaraoke(cuts, activeId), 500);
    return () => window.clearTimeout(timer);
  }, [status, fileMeta, cuts, activeId]);

  async function openFile(file: File) {
    const video = videoRef.current;
    if (!video) return;
    setError(null);
    setStatus("loading");
    statusRef.current = "loading";
    const url = URL.createObjectURL(file);
    const previousUrl = video.getAttribute("data-object-url");
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    video.setAttribute("data-object-url", url);
    video.src = url;
    video.load();
    try {
      await new Promise<void>((resolve, reject) => {
        const ok = () => {
          cleanup();
          resolve();
        };
        const bad = () => {
          cleanup();
          reject(new Error("This browser couldn't play that file. MP4 and WebM work best."));
        };
        const cleanup = () => {
          video.removeEventListener("loadedmetadata", ok);
          video.removeEventListener("error", bad);
        };
        if (video.readyState >= 1 && Number.isFinite(video.duration)) {
          resolve();
          return;
        }
        video.addEventListener("loadedmetadata", ok);
        video.addEventListener("error", bad);
      });
    } catch (err) {
      setStatus(fileRef.current ? "ready" : "empty");
      setError(err instanceof Error ? err.message : "Could not open that movie.");
      return;
    }

    const meta: FileMeta = {
      name: file.name,
      size: file.size,
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
    };
    const previous = fileRef.current;
    const switching = previous != null && (previous.name !== file.name || previous.size !== file.size);
    fileRef.current = file;
    demoModeRef.current = false;
    demoPlayingRef.current = false;
    video.pause();
    setPlaying(false);
    resetHearing();
    setFileMeta(meta);
    samplesRef.current = null;
    setCanRerank(false);
    if (switching) {
      setCues([]);
      setSrtName(null);
    }

    const saved = loadProject();
    if (saved && saved.name === file.name && saved.size === file.size) {
      setCuts(saved.cuts);
      setActiveId(saved.cuts[0]?.id ?? null);
      if (saved.cues?.length) {
        setCues(saved.cues);
        setSrtName(saved.srtName ?? null);
        setSignalList(signalsFrom(false, true));
        const uploaded = isUploadedSubs(saved.srtName) || saved.cues.some((cue) => cue.source === "file");
        const onlyHeard = saved.cues.every((cue) => cue.source === "heard");
        if (uploaded || !onlyHeard) manualLockRef.current = true;
        if (onlyHeard) {
          for (const cue of saved.cues) {
            const cut = cue.cutId ? saved.cuts.find((item) => item.id === cue.cutId) : undefined;
            if (cut) heardWindowRef.current.set(cut.id, windowKey(cut));
          }
        }
      } else if (switching) {
        setSignalList(["Picture energy"]);
      }
    } else {
      setCuts([]);
      setActiveId(null);
      if (switching) setSignalList(["Picture energy"]);
    }
    setStatus("ready");
  }

  async function chooseMovie() {
    setError(null);
    const picker = (window as PickerWindow).showOpenFilePicker;
    if (picker) {
      try {
        const [handle] = await picker({
          multiple: false,
          types: [
            {
              description: "Movie",
              accept: { "video/*": [".mp4", ".mov", ".m4v", ".webm", ".mkv"] },
            },
          ],
        });
        await saveMovieHandle(handle).catch(() => undefined);
        setRemembered(true);
        await openFile(await handle.getFile());
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    movieInputRef.current?.click();
  }

  async function openMagnet() {
    const link = parseMagnet(magnet);
    if (!link) {
      setError("Paste a full magnet link, starting with magnet:?");
      return;
    }
    magnetAbortRef.current?.abort();
    const ac = new AbortController();
    magnetAbortRef.current = ac;
    setFetching(true);
    setError(null);
    setProgress(0);
    setProgressLabel("Looking for peers");
    try {
      const file = await fileFromMagnet(link, (ratio, label) => {
        setProgress(ratio);
        setProgressLabel(label);
      }, ac.signal);
      await openFile(file);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setStatus(fileRef.current ? "ready" : "empty");
      statusRef.current = fileRef.current ? "ready" : "empty";
      setError(err instanceof Error ? err.message : "The magnet couldn't be opened.");
    } finally {
      setFetching(false);
      magnetAbortRef.current = null;
    }
  }

  async function reopenRemembered() {
    try {
      const handle = (await loadMovieHandle()) as DeviceHandle | null;
      if (!handle) {
        setRemembered(false);
        return;
      }
      let perm = (await handle.queryPermission?.({ mode: "read" })) ?? "prompt";
      if (perm !== "granted") perm = (await handle.requestPermission?.({ mode: "read" })) ?? "denied";
      if (perm !== "granted") {
        setError("Allow Movicut to read that movie again, or open it with the button.");
        return;
      }
      await openFile(await handle.getFile());
    } catch {
      setError("The remembered movie isn't available. Open it from this device again.");
    }
  }

  async function openSubs(file: File) {
    const text = await file.text();
    const parsed = parseSubtitles(text);
    if (!parsed.length) {
      setError("That subtitle file didn't contain any timed lines.");
      return;
    }
    setError(null);
    setCues(parsed);
    setSrtName(file.name);
    manualLockRef.current = true;
    hearGenRef.current += 1;
    queueRef.current = [];
    setHearingId(null);
    setSignalList(signalsFrom(usedAudioRef.current, true));
  }

  async function scan() {
    const video = videoRef.current;
    const file = fileRef.current;
    if (!video || !file || !fileMeta) return;
    if (fileMeta.duration < 50) {
      setError("This file is shorter than 50 seconds, so it can't hold a portrait cut.");
      return;
    }
    const ac = new AbortController();
    abortRef.current = ac;
    setStatus("scanning");
    setError(null);
    setProgress(0);
    setProgressLabel("Starting at the top of the film");
    const prevMute = video.muted;
    video.muted = true;
    video.pause();
    try {
      const result = await analyzeMovie({
        video,
        file,
        duration: fileMeta.duration,
        cues: cuesRef.current,
        signal: ac.signal,
        onProgress: (ratio, label) => {
          setProgress(ratio);
          setProgressLabel(label);
        },
      });
      samplesRef.current = result.samples;
      usedAudioRef.current = result.usedAudio;
      let cuts = result.cuts;
      let readScenes = false;
      if (result.shots.length >= 2 && !ac.signal.aborted) {
        setProgress(0.98);
        setProgressLabel("Reading the openings");
        try {
          const judged = await judgeMoments({
            data: {
              moments: result.shots.map((shot) => ({
                id: shot.id,
                start: shot.start,
                end: shot.end,
                category: shot.category,
                score: shot.score,
                quote: shot.quote ?? "",
                lines: shot.lines,
                openLine: shot.openLine,
                motion: shot.motion,
                contrast: shot.contrast,
                lum: shot.lum,
                audio: shot.audio,
                openingImage: shot.openingImage,
                thumbnailImage: shot.thumbnailImage,
                thumbnailAt: shot.thumbnailAt,
              })),
            },
          });
          if (judged.ok && judged.cuts.length) {
            cuts = cutsFromJudgement(result.cuts, result.shots, judged.cuts);
            readScenes = true;
          }
        } catch {
          /* the picture pass still stands */
        }
      }
      setCuts(cuts);
      setActiveId(cuts[0]?.id ?? null);
      if (!manualLockRef.current) {
        heardWindowRef.current = new Map();
        setSilentIds([]);
        setCues((prev) => prev.filter((cue) => cue.source !== "heard"));
      }
      const signals = signalsFrom(result.usedAudio, cues.length > 0 || !manualLockRef.current);
      if (readScenes) signals.push("AI retention rank", "AI thumbnail pick");
      setSignalList(signals);
      setCanRerank(true);
      if (!cuts.length) setError("No 50–59 second cut fit inside this file.");
      if (cuts[0]) {
        video.currentTime = cuts[0].start;
      }
      setStatus("ready");
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setError(err instanceof Error ? err.message : "The scan stopped.");
      }
      setStatus(fileMeta ? "ready" : "empty");
    } finally {
      video.muted = prevMute;
      abortRef.current = null;
    }
  }

  async function rerank() {
    const video = videoRef.current;
    if (!samplesRef.current || !fileMeta || !video) return;
    setError(null);
    const next = pickCuts(samplesRef.current, fileMeta.duration, cues, usedAudioRef.current);
    const withThumbs = await refreshThumbs(video, next);
    setCuts(withThumbs);
    setActiveId(withThumbs[0]?.id ?? null);
    setSignalList(signalsFrom(usedAudioRef.current, cues.length > 0));
    if (!next.length) setError("Those lines didn't leave a 50–59 second cut.");
  }

  function patchCut(id: string, partial: Partial<Cut>) {
    setCuts((prev) => prev.map((c) => (c.id === id ? { ...c, ...partial } : c)));
  }

  function moveStart(start: number) {
    if (!active || !fileMeta) return;
    const len = Math.min(59, Math.max(50, active.end - active.start));
    let s = start;
    if (s + len > fileMeta.duration) s = Math.max(0, fileMeta.duration - len);
    patchCut(active.id, { start: round2(s), end: round2(Math.min(fileMeta.duration, s + len)) });
  }

  function moveLen(len: number) {
    if (!active || !fileMeta) return;
    let end = active.start + len;
    let start = active.start;
    if (end > fileMeta.duration) {
      end = fileMeta.duration;
      start = Math.max(0, end - len);
    }
    patchCut(active.id, { start: round2(start), end: round2(end) });
  }

  function applyLines() {
    if (!active) return;
    const made = linesToCues(lineDraft.split("\n"), active.start, active.end);
    if (!made.length) {
      setError("Add one spoken line per row.");
      return;
    }
    setError(null);
    setCues((prev) => {
      const kept = prev.filter((c) => c.end <= active.start + 0.05 || c.start >= active.end - 0.05);
      const next = [...kept, ...made].sort((a, b) => a.start - b.start);
      cuesRef.current = next;
      return next;
    });
    setSrtName((name) => name ?? "Pasted lines");
    heardWindowRef.current.set(active.id, windowKey(active));
  }

  async function recordCut() {
    const video = videoRef.current;
    const cut = activeCutRef.current;
    if (!video || !cut || recording) return;
    if (cut.end - cut.start < 49.5) {
      setError("Save is for a 50–59 second cut.");
      return;
    }
    if (!manualLockRef.current && heardWindowRef.current.get(cut.id) !== windowKey(cut)) {
      const covered = cuesRef.current.some(
        (cue) => cue.source !== "heard" && cue.end > cut.start + 0.3 && cue.start < cut.end - 0.3,
      );
      if (!covered) {
        setHearError(null);
        enqueueKaraoke([cut], cut.id);
        const started = Date.now();
        while (heardWindowRef.current.get(cut.id) !== windowKey(cut) && Date.now() - started < 75_000) {
          await new Promise((resolve) => window.setTimeout(resolve, 150));
        }
      }
    }
    const mime = ["video/webm;codecs=vp8,opus", "video/webm;codecs=vp9,opus", "video/webm"].find((t) =>
      MediaRecorder.isTypeSupported(t),
    );
    if (!mime) {
      setError("This browser can't write a downloadable cut. Playback still works.");
      return;
    }
    recordingRef.current = true;
    setRecording(true);
    setError(null);
    video.pause();
    bedRef.current?.pause();
    try {
      await seekTo(video, cut.start);
    } catch {
      setRecording(false);
      recordingRef.current = false;
      setError("Couldn't move to the start of this cut.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setRecording(false);
      recordingRef.current = false;
      setError("Couldn't prepare the cut.");
      return;
    }
    const canvasStream = canvas.captureStream(30);
    let mix: { ctx: AudioContext; el: HTMLAudioElement } | null = null;
    const stopMix = () => {
      mix?.el.pause();
      void mix?.ctx.close().catch(() => undefined);
      mix = null;
    };
    try {
      const AudioCtx = window.AudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const dest = audioCtx.createMediaStreamDestination();
        const videoStream = (video as VideoWithCapture).captureStream?.();
        const movieTracks = videoStream?.getAudioTracks() ?? [];
        if (movieTracks.length) audioCtx.createMediaStreamSource(new MediaStream(movieTracks)).connect(dest);
        const el = new Audio(bedSrc(cut.category));
        el.loop = true;
        const source = audioCtx.createMediaElementSource(el);
        const gain = audioCtx.createGain();
        gain.gain.value = BED_VOLUME;
        source.connect(gain);
        gain.connect(dest);
        gain.connect(audioCtx.destination);
        await el.play();
        for (const track of dest.stream.getAudioTracks()) canvasStream.addTrack(track);
        mix = { ctx: audioCtx, el };
      }
    } catch {
      try {
        const videoStream = (video as VideoWithCapture).captureStream?.();
        if (videoStream) {
          for (const track of videoStream.getAudioTracks()) canvasStream.addTrack(track);
        }
      } catch {
        /* picture-only export */
      }
    }
    const rec = new MediaRecorder(canvasStream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    const stopped = new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
    });
    rec.start(250);
    const paint = window.setInterval(() => {
      const script = cuesToPhrases(cuesRef.current);
      const phrase = phraseAt(script, video.currentTime);
      const hot = phrase ? wordIndexAt(phrase, video.currentTime) : -1;
      drawStage(
        ctx,
        canvas.width,
        canvas.height,
        video,
        parseTitle(cut.title),
        phrase
          ? { words: phrase.words.map((w, i) => ({ text: w.text, hot: i === hot })), alpha: 1 }
          : null,
      );
    }, 1000 / 30);
    try {
      await video.play();
    } catch {
      window.clearInterval(paint);
      stopMix();
      rec.stop();
      setRecording(false);
      recordingRef.current = false;
      setError("Playback has to start before a cut can be saved.");
      return;
    }
    await new Promise<void>((resolve) => {
      const killer = window.setTimeout(() => {
        window.clearInterval(watch);
        window.clearInterval(paint);
        if (rec.state !== "inactive") rec.stop();
        resolve();
      }, (cut.end - cut.start + 8) * 1000);
      const watch = window.setInterval(() => {
        if (video.currentTime >= cut.end - 0.05) {
          window.clearTimeout(killer);
          window.clearInterval(watch);
          window.clearInterval(paint);
          video.pause();
          if (rec.state !== "inactive") rec.stop();
          resolve();
        }
      }, 120);
    });
    await stopped;
    stopMix();
    const recorded = new Blob(chunks, { type: mime });
    setExportProgress(0);
    const exported = await finalizeRecordedCut(recorded, (ratio) => setExportProgress(ratio));
    const url = URL.createObjectURL(exported.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `movicut-${cut.category}-${Math.round(cut.start)}s.${exported.extension}`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    setExportProgress(null);
    setRecording(false);
    if (!exported.converted) {
      setError("MP4 encoding is not available on this device, so Movicut saved a WebM instead.");
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = [...e.dataTransfer.files];
    const movie = files.find((f) => f.type.startsWith("video/") || /\.(mp4|mov|webm|mkv|m4v)$/i.test(f.name));
    const sub = files.find((f) => /\.(srt|vtt)$/i.test(f.name));
    if (movie) void openFile(movie);
    if (sub) void openSubs(sub);
  }

  const cutLen = active ? active.end - active.start : 0;
  const titleSrc = status === "scanning" ? "FINDING\nFIVE *CUTS*" : titleRef.current;
  const titleLines = parseTitle(titleSrc);
  useEffect(() => {
    const measure = () => {
      const box = titleFitRef.current;
      if (!box) return;
      const avail = box.clientWidth;
      let widest = 0;
      box.querySelectorAll("p").forEach((line) => {
        widest = Math.max(widest, line.scrollWidth);
      });
      setTitleScale(widest > 0 ? Math.min(1.7, Math.max(0.62, (avail - 10) / widest)) : 1);
    };
    measure();
    void document.fonts?.ready.then(measure);
  }, [titleSrc]);
  const shown = phraseAt(fileMeta ? phrases : DEMO_PHRASES, now);
  const hotWord = shown ? wordIndexAt(shown, now) : -1;
  const stillSrc = demoStill === 0 ? "/still-ticket.jpg" : "/still-booth.jpg";

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-3 pb-28 pt-4 sm:px-6 sm:pb-8 sm:pt-7">
      <header className="flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-pop/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-pop ring-1 ring-pop/30">
            <Sparkles className="size-3" aria-hidden="true" />
            AI Shorts Editor
          </div>
          <p className="font-poster text-4xl tracking-wide text-fg">MOVICUT</p>
          <p className="text-sm text-muted">Find the moments people will actually stop for</p>
        </div>
        <p className="hidden text-right text-sm text-muted sm:block">50–59 sec · AI-ranked · MP4 preferred</p>
      </header>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
        <section
          className="order-2 min-w-0 lg:order-1"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {!fileMeta ? (
            <div className={`rounded-3xl bg-surface p-5 ring-1 sm:p-7 ${dragOver ? "ring-pop" : "ring-line"}`}>
              <h1 className="font-poster text-4xl leading-none tracking-wide text-fg sm:text-5xl">
                FIVE SCENES.
                <br />
                THE LINE IN THE MIDDLE.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
                Open a full movie from this device. Movicut marks up to five stretches between 50 and 59 seconds — an epic
                turn, a joke, a line people repeat, a lesson, action, revenge. Each one plays tall, with a hook across the
                top and cutout karaoke in the center that disappears when the line is done.
              </p>
              <ol className="mt-5 grid gap-2 text-sm text-fg">
                <li>1. Open the movie. The picture stays in this browser.</li>
                <li>2. Find the cuts. Karaoke is written from the dialogue.</li>
                <li>3. Play or save. Each line leaves when it ends.</li>
              </ol>
              {srtName ? (
                <p className="mt-4 text-sm text-pop">
                  Subtitles ready · {srtName}. They stay with the movie you open next.
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => void chooseMovie()} disabled={status === "loading"}>
                  <FolderOpen aria-hidden="true" className="size-4" />
                  {status === "loading" ? "Reading the movie" : "Open a movie"}
                </Button>
                <Button variant="quiet" onClick={() => srtInputRef.current?.click()}>
                  <Subtitles aria-hidden="true" className="size-4" />
                  Add subtitles
                </Button>
                {remembered ? (
                  <Button variant="ghost" onClick={() => void reopenRemembered()}>
                    Reopen the last movie
                  </Button>
                ) : null}
              </div>
              <MagnetBar
                value={magnet}
                fetching={fetching}
                progress={progress}
                label={progressLabel}
                disabled={status === "loading" || status === "scanning"}
                onChange={setMagnet}
                onSubmit={() => void openMagnet()}
                onStop={() => magnetAbortRef.current?.abort()}
              />
              <ul className="mt-8 grid gap-2">
                {CATEGORY_ORDER.map((cat) => (
                  <li key={cat} className="text-sm">
                    <span className="text-pop">{CATEGORY_LABEL[cat]}</span>
                    <span className="text-muted"> — {BLURB[cat]}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm leading-relaxed text-muted">
                Ranking keeps a cut only when the first 3 to 5 seconds can stop a scroll. Epic, comedy, dialogue, a lesson, action, or revenge is used when the scene is actually that — never to fill a slot.
              </p>
              <p className="mt-3 text-sm text-muted">
                The full movie stays on this device. Movicut sends only a small set of candidate frames for AI ranking and about a minute of selected-cut audio for karaoke transcription.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className={`rounded-3xl bg-surface p-4 ring-1 sm:p-5 ${dragOver ? "ring-pop" : "ring-line"}`}>
                <p className="truncate font-medium text-fg">{fileMeta.name}</p>
                <p className="mt-1 text-sm tabular-nums text-muted">
                  {formatBytes(fileMeta.size)} · {formatTimecode(fileMeta.duration)} · {fileMeta.width}×{fileMeta.height}
                  {srtName ? ` · ${srtName}` : ""}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => void scan()} disabled={status === "scanning" || status === "loading" || !longEnough}>
                    {status === "scanning" ? "Reading the film" : "Find five cuts"}
                  </Button>
                  <Button variant="quiet" onClick={() => void chooseMovie()} disabled={status === "scanning"}>
                    Change movie
                  </Button>
                  <Button variant="quiet" onClick={() => srtInputRef.current?.click()} disabled={status === "scanning"}>
                    <Subtitles aria-hidden="true" className="size-4" />
                    {srtName ? "Replace subtitles" : "Add subtitles"}
                  </Button>
                </div>
                <MagnetBar
                  value={magnet}
                  fetching={fetching}
                  progress={progress}
                  label={progressLabel}
                  disabled={status === "loading" || status === "scanning"}
                  onChange={setMagnet}
                  onSubmit={() => void openMagnet()}
                  onStop={() => magnetAbortRef.current?.abort()}
                />
                {status === "scanning" ? (
                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-3 text-sm text-muted">
                      <span>{progressLabel}</span>
                      <span className="tabular-nums">{Math.round(progress * 100)}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full bg-pop" style={{ width: `${Math.round(progress * 100)}%` }} />
                    </div>
                    <Button
                      className="mt-3"
                      variant="ghost"
                      onClick={() => abortRef.current?.abort()}
                    >
                      Stop
                    </Button>
                  </div>
                ) : null}
                {!longEnough ? (
                  <p className="mt-3 text-sm text-muted">Portrait cuts are 50 to 59 seconds. This file is shorter than that.</p>
                ) : (
                  <p className="mt-3 text-sm text-muted">
                    A feature-length film takes a short while. Movicut seeks through it here.
                    {fileMeta.size > 18 * 1024 * 1024 ? " Sound peaks are skipped on large files." : ""} After the cuts
                    land, karaoke is written from each one's dialogue.
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {signalList.map((s) => (
                    <span key={s} className="rounded-full bg-surface-2 px-3 py-1 text-xs text-fg">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {error ? (
                <p role="alert" className="rounded-2xl bg-surface px-4 py-3 text-sm text-fg ring-1 ring-line">
                  {error}
                </p>
              ) : null}

              {cuts.length > 0 ? (
                <div className="grid gap-2">
                  {cuts.map((cut, index) => (
                    <ClipCard
                      key={cut.id}
                      cut={cut}
                      index={index}
                      selected={cut.id === activeId}
                      onSelect={() => {
                        setActiveId(cut.id);
                        const video = videoRef.current;
                        if (video) {
                          video.pause();
                          video.currentTime = cut.start;
                        }
                      }}
                    />
                  ))}
                </div>
              ) : status !== "scanning" ? (
                <p className="text-sm text-muted">No cuts yet. Find them after the movie is open.</p>
              ) : null}
              {cuts.length > 0 && cuts.length < 5 ? (
                <p className="text-sm text-muted">
                  This file can hold {cuts.length} {cuts.length === 1 ? "cut" : "cuts"} of 50–59 seconds. A full movie yields five.
                </p>
              ) : null}

              {active ? (
                <div className="grid gap-4 rounded-3xl bg-surface p-4 ring-1 ring-line sm:p-5">
                  <div>
                    <p className="text-xs text-pop">{CATEGORY_LABEL[active.category]}</p>
                    <h2 className="mt-1 font-poster text-3xl leading-none tracking-wide text-fg">{plainTitle(active.title)}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{active.reason}</p>
                    {active.quote ? <p className="mt-2 text-sm text-fg">“{active.quote}”</p> : null}
                  </div>
                  <label className="grid gap-2 text-sm text-muted">
                    Hook title
                    <textarea
                      rows={2}
                      value={active.title}
                      maxLength={90}
                      onChange={(e) => patchCut(active.id, { title: e.target.value.toUpperCase() })}
                      className="rounded-2xl bg-bg px-3 py-3 font-poster text-xl tracking-wide text-fg ring-1 ring-line outline-none focus:ring-pop"
                    />
                    <span>Put *asterisks* around the word that should turn yellow.</span>
                  </label>
                  {longEnough ? (
                    <div className="grid gap-3">
                      <label className="grid gap-2 text-sm text-muted">
                        <span className="flex justify-between">
                          Starts at <span className="tabular-nums text-fg">{formatTimecode(active.start)}</span>
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(0, fileMeta.duration - 50)}
                          step={1}
                          value={Math.min(active.start, Math.max(0, fileMeta.duration - 50))}
                          onChange={(e) => moveStart(Number(e.target.value))}
                          className="accent-pop"
                        />
                      </label>
                      <label className="grid gap-2 text-sm text-muted">
                        <span className="flex justify-between">
                          Length <span className="tabular-nums text-fg">{formatSeconds(cutLen)}</span>
                        </span>
                        <input
                          type="range"
                          min={50}
                          max={59}
                          step={1}
                          value={Math.round(Math.min(59, Math.max(50, cutLen)))}
                          onChange={(e) => moveLen(Number(e.target.value))}
                          className="accent-pop"
                        />
                      </label>
                    </div>
                  ) : null}
                  <label className="grid gap-2 text-sm text-muted">
                    Lines for this cut
                    <textarea
                      rows={4}
                      value={lineDraft}
                      onChange={(e) => setLineDraft(e.target.value)}
                      placeholder={"One spoken line per row\nThey play in order and then leave"}
                      className="rounded-2xl bg-bg px-3 py-3 text-sm text-fg ring-1 ring-line outline-none focus:ring-pop"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="quiet" onClick={applyLines}>
                      Time these lines
                    </Button>
                    {canRerank ? (
                      <Button variant="quiet" onClick={() => void rerank()}>
                        Rank again with these lines
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted">
                    {hearingId
                      ? "Writing cutout karaoke from the dialogue…"
                      : hearError
                        ? hearError
                        : active && silentIds.includes(active.id) && !cues.some((cue) => cue.cutId === active.id)
                          ? "No spoken lines in this cut. Paste them if you still want words."
                          : cues.some((cue) => cue.source === "heard")
                            ? "Cutout karaoke is already on the cuts. Each line leaves when it ends."
                            : cues.length
                              ? `${cues.length} timed lines loaded. Karaoke follows them and clears when each phrase ends.`
                              : "Karaoke writes itself once the cuts are in. An .srt is optional."}
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section className="order-1 lg:order-2 lg:sticky lg:top-4">
          {!fileMeta ? (
            <div className="mb-3 flex justify-center lg:hidden">
              <Button onClick={() => void chooseMovie()} disabled={status === "loading"}>
                <FolderOpen aria-hidden="true" className="size-4" />
                {status === "loading" ? "Reading the movie" : "Open a movie"}
              </Button>
            </div>
          ) : null}
          <div className="stage-frame relative mx-auto overflow-hidden rounded-3xl bg-black ring-1 ring-line">
            <div className="relative flex h-full flex-col">
              <div className="flex-[0.85]" />
              <div ref={titleFitRef} className="w-full overflow-hidden px-1 pb-1.5">
                <div className="origin-center text-center" style={{ transform: `scale(${titleScale})` }}>
                  {titleLines.map((line, i) => (
                    <p key={i} className="font-poster text-[2.15rem] leading-[0.9] tracking-wide whitespace-nowrap text-fg sm:text-[2.85rem]">
                      {line.map((word, j) => (
                        <span key={j} className={word.hot ? "text-pop" : "text-fg"}>
                          {word.text}{" "}
                        </span>
                      ))}
                    </p>
                  ))}
                </div>
              </div>
              <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  playsInline
                  preload="metadata"
                  className={`h-full w-full object-cover ${fileMeta ? "" : "pointer-events-none opacity-0"}`}
                />
                {!fileMeta ? <img src={stillSrc} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
                {!playing && !recording ? (
                  <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                    <span className="flex size-14 items-center justify-center rounded-full bg-pop text-ink">
                      <Play aria-hidden="true" className="size-6" />
                    </span>
                  </span>
                ) : null}
              </div>
              <div
                className={`flex flex-[1.1] items-start justify-center px-3 pt-4 text-center transition-opacity duration-150 ${shown ? "opacity-100" : "opacity-0"}`}
              >
                <p className="text-2xl leading-tight font-extrabold sm:text-3xl">
                  {shown
                    ? shown.words.map((word, i) => (
                        <span key={`${shown.id}-${i}`} className={i === hotWord ? "karaoke-cut is-hot" : "karaoke-cut"}>
                          {word.text}{" "}
                        </span>
                      ))
                    : null}
                </p>
              </div>
            </div>
            {!recording ? (
              <button
                type="button"
                className="absolute inset-0 z-10"
                aria-label={playing ? "Pause the portrait" : "Play the portrait"}
                onClick={() => toggleRef.current()}
              />
            ) : null}
            {hearingId && fileMeta ? (
              <span className="pointer-events-none absolute bottom-20 left-1/2 z-10 -translate-x-1/2 rounded-full bg-bg/80 px-3 py-1 text-xs text-fg ring-1 ring-line">
                Writing karaoke
              </span>
            ) : null}
          </div>
          <p className="sr-only" aria-live="polite">
            {liveLine}
          </p>
          <p className="mt-3 text-center text-sm text-muted">
            {fileMeta && active
              ? `${formatTimecode(active.start)} – ${formatTimecode(active.end)} · ${formatSeconds(active.end - active.start)}`
              : fileMeta
                ? formatTimecode(fileMeta.duration)
                : "Style preview — open your movie for real cuts"}
          </p>
          {fileMeta && active ? (
            <p className="text-center font-poster text-3xl tabular-nums tracking-wide text-fg">
              {formatTimecode(Math.max(0, Math.min(cutLen, now - active.start)))}
            </p>
          ) : null}
          <div className="mx-auto mt-3 flex w-full max-w-md flex-wrap items-center justify-center gap-2">
            <Button variant="quiet" onClick={() => toggleRef.current()} disabled={recording}>
              {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
              {playing ? "Pause" : "Play"}
            </Button>
            <Button
              variant="quiet"
              disabled={!active || recording}
              onClick={() => {
                const video = videoRef.current;
                if (!video || !active) return;
                video.currentTime = active.start;
                void video.play().catch(() => undefined);
              }}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Restart cut
            </Button>
            <Button onClick={() => void recordCut()} disabled={!active || recording || cutLen < 49.5}>
              <Download className="size-4" aria-hidden="true" />
              {recording ? "Saving" : "Save this cut"}
            </Button>
          </div>
          {recording ? (
            <p className="mt-2 text-center text-sm text-muted">
              {exportProgress == null
                ? "Rendering the cut once in real time. Keep this tab open."
                : `Encoding social-ready MP4… ${Math.round(exportProgress * 100)}%`}
            </p>
          ) : null}
        </section>
      </div>

      <div className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-2 rounded-2xl bg-surface/95 p-2 shadow-2xl ring-1 ring-line backdrop-blur sm:hidden">
        <Button
          className="min-w-0 flex-1"
          variant="quiet"
          onClick={() => (fileMeta ? void scan() : void chooseMovie())}
          disabled={status === "scanning" || status === "loading" || (fileMeta ? !longEnough : false)}
        >
          <Sparkles className="size-4" aria-hidden="true" />
          {fileMeta ? (status === "scanning" ? "Finding" : "AI clips") : "Open"}
        </Button>
        <Button className="min-w-0 flex-1" variant="quiet" onClick={() => toggleRef.current()} disabled={recording}>
          {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
          {playing ? "Pause" : "Play"}
        </Button>
        <Button
          className="min-w-0 flex-1"
          onClick={() => void recordCut()}
          disabled={!active || recording || cutLen < 49.5}
        >
          <Download className="size-4" aria-hidden="true" />
          {recording ? "Saving" : "MP4"}
        </Button>
      </div>

      {!fileMeta && error ? (
        <p role="alert" className="mt-4 rounded-2xl bg-surface px-4 py-3 text-sm text-fg ring-1 ring-line">
          {error}
        </p>
      ) : null}

      <input
        ref={movieInputRef}
        type="file"
        accept="video/*,.mp4,.mov,.webm,.mkv,.m4v"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void openFile(file);
        }}
      />
      <input
        ref={srtInputRef}
        type="file"
        accept=".srt,.vtt,text/vtt,application/x-subrip"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void openSubs(file);
        }}
      />
    </main>
  );
}
