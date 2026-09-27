import { ToastProvider } from "@/components/Toast.jsx";

export default function DashboardLayout({ children }) {
  return <ToastProvider>{children}</ToastProvider>;
}
