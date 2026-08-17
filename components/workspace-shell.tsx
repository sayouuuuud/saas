import Link from "next/link";
import { BarChart3, Bell, CreditCard, FileText, Link2, LifeBuoy, LockKeyhole, Settings, Users, WalletCards } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

const links = [
  ["overview", "/app/overview", "نظرة عامة", BarChart3],
  ["profile", "/app/profile", "ملفي", Users],
  ["lms", "/app/lms-connection", "رابط المنصة", Link2],
  ["subscription", "/app/subscription", "الاشتراك", WalletCards],
  ["billing", "/billing", "الفوترة", CreditCard],
  ["usage", "/app/usage", "الاستخدام", BarChart3],
  ["reports", "/app/reports", "التقارير", FileText],
  ["team", "/app/team", "الفريق", Users],
  ["support", "/support", "الدعم", LifeBuoy],
  ["notifications", "/app/notifications", "الإشعارات", Bell],
  ["security", "/app/security", "الأمان", LockKeyhole],
  ["settings", "/app/settings", "الإعدادات", Settings],
] as const;

export default async function WorkspaceShell({ active, title, intro, children }: { active: string; title: string; intro: string; children: React.ReactNode }) {
  const user = await getCurrentUser();
  return <main className="workspace-shell"><a className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3" href="#workspace-main">تخطي إلى المحتوى الرئيسي</a><aside className="workspace-sidebar" aria-label="التنقل في مساحة العمل"><Link href="/" className="brand" aria-label="مركزية، الصفحة الرئيسية"><span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>مركزية</Link><div className="workspace-user"><span aria-hidden="true">{user?.name?.slice(0, 1) || "م"}</span><div><b>{user?.workspace?.name || "مساحة العمل"}</b><small>{user?.email || "حساب SaaS"}</small></div></div><nav className="workspace-nav" aria-label="أقسام مساحة العمل"><span>المساحة الرئيسية</span>{links.map(([key, href, label, Icon]) => <Link key={key} href={href} className={key === active ? "active" : ""} aria-current={key === active ? "page" : undefined}><Icon size={16} aria-hidden="true" />{label}</Link>)}</nav><Link href="/dashboard" className="workspace-back">العودة للوحة الحالية ↩</Link></aside><section id="workspace-main" className="workspace-content" aria-labelledby="workspace-title"><header className="workspace-header"><div><span className="section-eyebrow"><span className="eyebrow-dot" aria-hidden="true" />مساحة SaaS</span><h1 id="workspace-title" tabIndex={-1}>{title}</h1><p>{intro}</p></div><div className="workspace-header-actions"><span className="workspace-status" role="status"><i aria-hidden="true" /> الحساب متصل</span><Link href="/support" className="button button-outline">الدعم</Link></div></header>{children}</section></main>;
}
