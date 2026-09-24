import { db } from "./supabase.js";

async function toDataUri(path) {
  if (!path) return null;
  const { data, error } = await db().storage.from("branding").download(path);
  if (error || !data) return null;
  const mime = path.endsWith(".jpg") ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${Buffer.from(await data.arrayBuffer()).toString("base64")}`;
}

export async function loadBranding(org) {
  const [logoUri, signatureUri] = await Promise.all([toDataUri(org.logo_path), toDataUri(org.signature_path)]);
  return { logoUri, signatureUri };
}
