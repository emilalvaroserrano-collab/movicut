import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/identify-9V4ExA-c.js
var judgeMoments_createServerFn_handler = createServerRpc({
	id: "68155b852f651cbb5e4fc5e23d5c9d45dd8645758aa80bc18b9f32a6ecd1e8d0",
	name: "judgeMoments",
	filename: "src/lib/identify.ts"
}, (opts) => judgeMoments.__executeServer(opts));
var judgeMoments = createServerFn({ method: "POST" }).validator((input) => {
	if (!input || !Array.isArray(input.moments) || input.moments.length < 2 || input.moments.length > 6) throw new Error("Not enough scenes to read.");
	return { moments: input.moments.map((moment) => ({
		id: String(moment.id).slice(0, 12),
		start: Number(moment.start) || 0,
		end: Number(moment.end) || 0,
		category: String(moment.category).slice(0, 16),
		score: Number(moment.score) || 0,
		quote: String(moment.quote ?? "").slice(0, 140),
		lines: String(moment.lines ?? "").slice(0, 240),
		openLine: String(moment.openLine ?? "").slice(0, 160),
		motion: Number(moment.motion) || 0,
		contrast: Number(moment.contrast) || 0,
		lum: Number(moment.lum) || 0,
		audio: Number(moment.audio) || 0,
		image: String(moment.image ?? "").replace(/^data:image\/jpeg;base64,/, "").slice(0, 18e4)
	})) };
}).handler(judgeMoments_createServerFn_handler, async ({ data }) => {
	const { judgeMomentsOnServer } = await import("./identify.server-Drb6XPwy.mjs");
	return judgeMomentsOnServer(data.moments);
});
//#endregion
export { judgeMoments_createServerFn_handler };
