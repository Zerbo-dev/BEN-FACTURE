import { handle, requireOrg } from "@/lib/auth.js";
import { restoreBatch } from "@/lib/archive.js";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = handle(async (req) => {
  const { org } = await requireOrg(req);
  const { batch_id } = await req.json();
  return Response.json(await restoreBatch(org.id, batch_id));
});
