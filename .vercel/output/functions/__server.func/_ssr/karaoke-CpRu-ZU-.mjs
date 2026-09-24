import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/karaoke-CpRu-ZU-.js
var transcribeClip_createServerFn_handler = createServerRpc({
	id: "7d305bc4556981cf000308f16c62017b5c56759c3c248ed266b93ba25d5e79bb",
	name: "transcribeClip",
	filename: "src/lib/karaoke.ts"
}, (opts) => transcribeClip.__executeServer(opts));
var transcribeClip = createServerFn({ method: "POST" }).validator((input) => {
	if (!input || typeof input.wavBase64 !== "string" || input.wavBase64.length < 200 || input.wavBase64.length > 8e6) throw new Error("That cut's audio can't be captioned.");
	return { wavBase64: input.wavBase64 };
}).handler(transcribeClip_createServerFn_handler, async ({ data }) => {
	const { transcribeWavOnServer } = await import("./karaoke.server-BZlTAYpj.mjs");
	return transcribeWavOnServer(data.wavBase64);
});
//#endregion
export { transcribeClip_createServerFn_handler };
