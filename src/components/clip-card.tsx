import { Gauge, Sparkles } from "lucide-react";
import { CATEGORY_LABEL, plainTitle, type Cut } from "@/lib/analyze";
import { formatSeconds, formatTimecode } from "@/lib/format";

export function ClipCard(props: {
  cut: Cut;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { cut, index, selected, onSelect } = props;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`flex w-full gap-3 rounded-2xl bg-surface p-3 text-left ring-1 transition active:scale-[0.995] ${selected ? "ring-pop" : "ring-line"}`}
    >
      <span className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-surface-2">
        {cut.thumb ? (
          <img src={cut.thumb} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-poster text-2xl text-pop">
            {index + 1}
          </span>
        )}
        {cut.viralScore != null ? (
          <span className="absolute bottom-1 left-1 rounded-full bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {cut.viralScore}
          </span>
        ) : null}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold uppercase tracking-wide text-pop">
          {CATEGORY_LABEL[cut.category]}
        </span>
        <span className="mt-1 block font-poster text-xl leading-none tracking-wide text-fg">
          {plainTitle(cut.title)}
        </span>

        {cut.viralScore != null || cut.hookScore != null ? (
          <span className="mt-2 flex flex-wrap gap-1.5">
            {cut.viralScore != null ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-pop/10 px-2 py-0.5 text-[11px] font-bold text-pop ring-1 ring-pop/25">
                <Sparkles className="size-3" aria-hidden="true" />
                Viral {cut.viralScore}
              </span>
            ) : null}
            {cut.hookScore != null ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-fg">
                <Gauge className="size-3" aria-hidden="true" />
                Hook {cut.hookScore}
              </span>
            ) : null}
          </span>
        ) : null}

        <span className="mt-1.5 block text-xs tabular-nums text-muted">
          {formatTimecode(cut.start)} – {formatTimecode(cut.end)} · {formatSeconds(cut.end - cut.start)}
        </span>
      </span>
    </button>
  );
}
