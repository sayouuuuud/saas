import Link from "next/link";
import { BarChart3, Bell, CreditCard, FileText, Link2, LifeBuoy, LockKeyhole, Settings, Users, WalletCards } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

const links = [
  ["overview", "/app/overview", "نظرة عامة", BarChart3],
  ["profile", "/app/profile", "ملفي", Users],
  ["lms", "/app/lms", "رابط المنصة", Link2],
  ["subscription", "/app/subscription", "الاشتراك", WalletCards],
  ["billing", "/app/billing", "الفوترة", CreditCard],
  ["usage", "/app/usage", "الاستخدام", BarChart3],
  ["reports", "/app/reports", "التقارير", FileText],
  ["team", "/app/team", "الفريق", Users],
  ["support", "/app/support", "الدعم", LifeBuoy],
  ["notifications", "/app/notifications", "الإشعارات", Bell],
  ["security", "/app/security", "الأمان", LockKeyhole],
  ["settings", "/app/settings", "الإعدادات", Settings],
] as const;

export default async function WorkspaceShell({ active, title, intro, children }: { active: string; title: string; intro: string; children: React.ReactNode }) {
  const user = await getCurrentUser();
  return <main className="workspace-shell"><aside className="workspace-sidebar"><Link href="/" className="brand"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><div className="workspace-user"><span>{user?.name?.slice(0, 1) || "م"}</span><div><b>{user?.workspace?.name || "مساحة العمل"}</b><small>{user?.email || "حساب SaaS"}</small></div></div><nav className="workspace-nav"><span>المساحة الرئيسية</span>{links.map(([key, href, label, Icon]) => <Link key={key} href={href} className={key === active ? "active" : ""}><Icon size={16} />{label}</Link>)}</nav><Link href="/dashboard" className="workspace-back">العودة للوحة الحالية ↩</Link></aside><section className="workspace-content"><header className="workspace-header"><div><span className="section-eyebrow"><span className="eyebrow-dot" />مساحة SaaS</span><h1>{title}</h1><p>{intro}</p></div><div className="workspace-header-actions"><span className="workspace-status"><i /> الحساب متصل</span><Link href="/support" className="button button-outline">الدعم</Link></div></header>{children}</section></main>;
}
