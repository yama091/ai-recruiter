import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

export async function GET() {
  const path = join(process.cwd(), "public", "og-image.png");
  const buffer = await readFile(path);
  return new Response(buffer, {
    headers: {
      "Content-Type": "image/png",
    },
  });
}
