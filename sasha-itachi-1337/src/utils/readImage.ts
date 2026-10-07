import { readFile, BaseDirectory } from "@tauri-apps/plugin-fs";

export async function readImageAsDataUrl(path: string | null): Promise<string> {
    if (!path) return "";

    try {
        const bytes = await readFile(path, { baseDir: BaseDirectory.AppData });

        const ext = path.split(".").pop()!.toLowerCase();
        const mime = ext === "jpg" ? "jpeg" : ext;

        let binary = "";
        const chunkSize = 0x8000;

        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
            binary += String.fromCharCode(...chunk);
        }

        return `data:image/${mime};base64,${btoa(binary)}`;
    } catch (e) {
        console.error("Не удалось прочитать картинку:", path, e);
        return "";
    }
}