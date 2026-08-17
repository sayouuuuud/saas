'use client'

import Link from 'next/link'
import { ArrowLeft, Bell, Check, ChevronDown, CircleHelp, CreditCard, ExternalLink, FileText, LayoutDashboard, Link2, Menu, Plus, Settings, ShieldCheck, Users, X } from 'lucide-react'
import { useState } from 'react'

const nav = [
  { label: 'نظرة عامة', icon: LayoutDashboard },
  { label: 'الاشتراك والفوترة', icon: CreditCard },
  { label: 'رابط المنصة', icon: Link2 },
  { label: 'الفريق', icon: Users },
  { label: 'الدعم', icon: CircleHelp },
]

export default function DashboardPage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [linkAdded, setLinkAdded] = useState(false)

  return (
    <main className="dashboard-page">
      <aside className={`app-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="app-sidebar-head"><Link href="/" className="brand"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><button className="sidebar-close" onClick={() => setMobileOpen(false)}><X size={17} /></button></div>
        <div className="workspace-switcher"><span className="workspace-avatar">أ</span><span><b>أكاديمية النور</b><small>حساب المدرس</small></span><ChevronDown size={13} /></div>
        <small className="app-nav-label">المساحة الرئيسية</small>
        <nav className="app-nav">{nav.map(({ label, icon: Icon }, index) => <button key={label} className={`app-nav-item ${index === 0 ? 'active' : ''}`}><Icon size={16} /><span>{label}</span>{index === 3 && <small>3</small>}</button>)}</nav>
        <div className="app-sidebar-bottom"><div className="app-user"><span className="mini-avatar">أ</span><span><b>أحمد علي</b><small>المالك</small></span></div><button><Settings size={15} /></button></div>
      </aside>
      {mobileOpen && <button className="sidebar-overlay" aria-label="إغلاق القائمة" onClick={() => setMobileOpen(false)} />}
      <section className="dashboard-main">
        <header className="dashboard-header"><button className="dashboard-menu" onClick={() => setMobileOpen(true)}><Menu size={19} /></button><div><span className="dashboard-date">الثلاثاء، 17 يونيو 2025</span><h1>صباح الخير، أحمد <em>✦</em></h1></div><div className="dashboard-header-actions"><button className="notification-button"><Bell size={17} /><i /></button><Link href="/" className="button button-outline">العودة للموقع</Link></div></header>
        <div className="dashboard-alert"><div className="alert-icon"><Link2 size={16} /></div><div><b>{linkAdded ? 'رابط منصتك متصل' : 'أضف رابط منصتك التعليمية'}</b><span>{linkAdded ? 'يمكنك الوصول إلى منصتك من مكان واحد.' : 'حسابك نشط. اربط منصتك للوصول إليها من هنا.'}</span></div>{linkAdded ? <span className="connected-badge"><Check size={12} /> متصل</span> : <button className="button button-light" onClick={() => setLinkAdded(true)}>إضافة رابط</button>}</div>
        <div className="dashboard-metrics"><article className="dash-card"><div className="dash-card-head"><span>الباقة الحالية</span><CreditCard size={16} /></div><strong>Growth</strong><small>تتجدد في 17 يوليو 2025</small><Link href="#billing" className="dash-link">إدارة الباقة <ArrowLeft size={13} /></Link></article><article className="dash-card"><div className="dash-card-head"><span>حالة الحساب</span><ShieldCheck size={16} /></div><strong className="status-active"><i /> نشط</strong><small>كل شيء يعمل بشكل جيد</small><div className="status-bars"><i /><i /><i /><i /><i /></div></article><article className="dash-card"><div className="dash-card-head"><span>آخر فاتورة</span><FileText size={16} /></div><strong>$31.00</strong><small>فاتورة #MK-0048 · مدفوعة</small><Link href="#billing" className="dash-link">عرض الفواتير <ArrowLeft size={13} /></Link></article></div>
        <div className="dashboard-grid"><article className="dash-panel activity-panel"><div className="panel-heading"><div><b>نشاط الحساب</b><span>آخر 30 يومًا</span></div><button className="period-button">آخر 30 يومًا <ChevronDown size={13} /></button></div><div className="activity-chart"><div className="chart-axis"><span>100%</span><span>50%</span><span>0%</span></div><svg viewBox="0 0 600 175" preserveAspectRatio="none" aria-label="مخطط نشاط الحساب"><path d="M0 145 C50 132 64 138 105 112 S160 128 205 95 S260 117 300 76 S355 86 390 50 S455 73 490 37 S555 54 600 18" fill="none" stroke="#ec794e" strokeWidth="4" strokeLinecap="round" /><path d="M0 145 C50 132 64 138 105 112 S160 128 205 95 S260 117 300 76 S355 86 390 50 S455 73 490 37 S555 54 600 18 L600 175 L0 175Z" fill="url(#area)" opacity=".45" /><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#ec794e" stopOpacity=".25" /><stop offset="1" stopColor="#ec794e" stopOpacity="0" /></linearGradient></defs></svg><div className="chart-labels"><span>18 مايو</span><span>25 مايو</span><span>1 يونيو</span><span>8 يونيو</span><span>15 يونيو</span></div></div></article><article className="dash-panel link-panel"><div className="panel-heading"><div><b>رابط المنصة</b><span>الوصول السريع</span></div><Link2 size={16} /></div>{linkAdded ? <div className="link-connected"><div className="link-success-icon"><Check size={18} /></div><b>academy.example.com</b><small>آخر تحقق منذ لحظات</small><a href="https://academy.example.com" target="_blank" rel="noreferrer">فتح المنصة <ExternalLink size={13} /></a></div> : <div className="link-empty"><div className="empty-icon"><Link2 size={17} /></div><b>لم تتم إضافة رابط بعد</b><span>أضف رابط LMS الخاص بك للوصول السريع والتحقق من حالته.</span><button onClick={() => setLinkAdded(true)}><Plus size={13} /> إضافة رابط</button></div>}</article></div>
        <div className="dashboard-footer-note"><ShieldCheck size={15} /> بياناتك في أمان · صلاحيات واضحة دائمًا <span>آخر مزامنة منذ لحظات</span></div>
      </section>
    </main>
  )
}
