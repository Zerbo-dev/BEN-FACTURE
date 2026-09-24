import { handle, requireOrg, publicOrg, HttpError } from "@/lib/auth.js";
import { db, must } from "@/lib/supabase.js";

export const runtime = "nodejs";

const KINDS = { logo: "logo_path", signature: "signature_path" };
const MAX_BYTES = 200 * 1024; // le navigateur réduit déjà l'image ; ceci est un garde-fou

// Envoi d'un logo ou d'une signature (data URL PNG/JPEG déjà réduite côté navigateur) vers Supabase Storage.
export const POST = handle(async (req) => {
  const { org } = await requireOrg(req);
  const { kind, dataUrl } = await req.json();
  const col = KINDS[kind];
  const m = /^data:image\/(png|jpeg);base64,(.+)$/.exec(dataUrl || "");
  if (!col || !m) throw new HttpError(400, "Image invalide (PNG ou JPEG).");
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > MAX_BYTES) throw new HttpError(413, "Image trop lourde (200 Ko max après réduction).");

  const path = `${org.id}/${kind}.${m[1] === "png" ? "png" : "jpg"}`;
  const bucket = db().storage.from("branding");
  if (org[col] && org[col] !== path) await bucket.remove([org[col]]);
  const up = await bucket.upload(path, buf, { upsert: true, contentType: `image/${m[1]}` });
  if (up.error) throw new Error(up.error.message);
  const updated = must(await db().from("organizations").update({ [col]: path }).eq("id", org.id).select("*").single());
  return Response.json(publicOrg(updated));
});

export const DELETE = handle(async (req) => {
  const { org } = await requireOrg(req);
  const col = KINDS[new URL(req.url).searchParams.get("kind")];
  if (!col) throw new HttpError(400, "Type inconnu.");
  if (org[col]) await db().storage.from("branding").remove([org[col]]);
  const updated = must(await db().from("organizations").update({ [col]: null }).eq("id", org.id).select("*").single());
  return Response.json(publicOrg(updated));
});
