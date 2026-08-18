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

type DemoUser = { name: string; email: string; workspaceName: string };
type WorkspaceShellProps = { active: string; title: string; intro: string; children: React.ReactNode; demoBasePath?: string; demoUser?: DemoUser };

export default async function WorkspaceShell({ active, title, intro, children, demoBasePath, demoUser }: WorkspaceShellProps) {
  const user = demoUser ? null : await getCurrentUser();
  const isDemo = Boolean(demoBasePath && demoUser);
  const toDemoHref = (key: string, href: string) => isDemo ? `${demoBasePath}${key === "overview" ? "" : `/${key}`}` : href;
  const displayName = demoUser?.name || user?.name || "م";
  const workspaceName = demoUser?.workspaceName || user?.workspace?.name || "مساحة العمل";
  const email = demoUser?.email || user?.email || "حساب SaaS";
  return <main className="workspace-shell"><a className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3" href="#workspace-main">تخطي إلى المحتوى الرئيسي</a><aside className="workspace-sidebar" aria-label="التنقل في مساحة العمل"><Link href="/" className="brand" aria-label="مركزية، الصفحة الرئيسية"><span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>مركزية</Link><div className="workspace-user"><span aria-hidden="true">{displayName.slice(0, 1)}</span><div><b>{workspaceName}</b><small>{email}</small></div></div><nav className="workspace-nav" aria-label="أقسام مساحة العمل"><span>المساحة الرئيسية</span>{links.map(([key, href, label, Icon]) => <Link key={key} href={toDemoHref(key, href)} className={key === active ? "active" : ""} aria-current={key === active ? "page" : undefined}><Icon size={16} aria-hidden="true" />{label}</Link>)}</nav><Link href={isDemo ? demoBasePath! : "/dashboard"} className="workspace-back">{isDemo ? "العودة إلى العرض التجريبي ↩" : "العودة للوحة الحالية ↩"}</Link></aside><section id="workspace-main" className="workspace-content" aria-labelledby="workspace-title"><header className="workspace-header"><div><span className="section-eyebrow"><span className="eyebrow-dot" aria-hidden="true" />مساحة SaaS</span><h1 id="workspace-title" tabIndex={-1}>{title}</h1><p>{intro}</p></div><div className="workspace-header-actions"><span className="workspace-status" role="status"><i aria-hidden="true" />{isDemo ? "وضع العرض · قراءة فقط" : "الحساب متصل"}</span><Link href={toDemoHref("support", "/support")} className="button button-outline">الدعم</Link></div></header>{children}</section></main>;
}
