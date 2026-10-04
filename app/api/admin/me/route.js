import { handle } from "@/lib/auth.js";
import { requireAdmin } from "@/lib/admin.js";

export const runtime = "nodejs";

export const GET = handle(async (req) => {
  const { user } = await requireAdmin(req);
  return Response.json({ ok: true, email: user.email });
});
