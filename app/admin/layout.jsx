import { ToastProvider } from "@/components/Toast.jsx";

export default function AdminLayout({ children }) {
  return <ToastProvider>{children}</ToastProvider>;
}
