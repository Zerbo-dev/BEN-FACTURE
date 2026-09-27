import { handle, requireOrg } from "@/lib/auth.js";
import { monthlyCount } from "@/lib/documents.js";
import { FREE_MONTHLY_LIMIT } from "@/lib/meta.js";

export const runtime = "nodejs";

export const GET = handle(async (req) => {
  const { org } = await requireOrg(req);
  const used = await monthlyCount(org.id);
  const limit = org.plan === "pro" ? null : FREE_MONTHLY_LIMIT;
  return Response.json({ plan: org.plan, used, limit, remaining: limit === null ? null : Math.max(0, limit - used) });
});
