"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LayoutDashboard, Activity } from "lucide-react";
import { api, supabase } from "@/lib/browser.js";
import DashboardShell from "@/components/DashboardShell.jsx";
import AdminStats from "@/components/AdminStats.jsx";
import AdminOrgs from "@/components/AdminOrgs.jsx";
import AdminCron from "@/components/AdminCron.jsx";

const TABS = [["orgs", "Organisations", LayoutDashboard], ["cron", "Santé du cron", Activity]];

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("orgs");

  useEffect(() => {
    (async () => {
      const { data } = await supabase().auth.getSession();
      if (!data.session) return location.replace("/login");
      try {
        await api("/api/admin/me"); // 403 si l'e-mail n'est pas dans ADMIN_EMAILS
        setReady(true);
      } catch (e) {
        if (e.message?.includes("réservé")) return location.replace("/dashboard");
        setErr(e.message);
      }
    })();
  }, []);

  async function logout() { await supabase().auth.signOut(); location.replace("/"); }

  if (err) return <main className="wrap" style={{ paddingTop: 24 }}><p className="msg err" role="alert">{err}</p></main>;
  if (!ready) return <main className="wrap" style={{ paddingTop: 24 }}><p className="muted">Chargement…</p></main>;

  return (
    <DashboardShell brand="Admin" tabs={TABS} active={tab} onSelect={setTab} onLogout={logout}>
      <AdminStats />
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
          {tab === "orgs" && <AdminOrgs />}
          {tab === "cron" && <AdminCron />}
        </motion.div>
      </AnimatePresence>
    </DashboardShell>
  );
}
