'use client'

import Link from 'next/link'
import { ArrowLeft, Bell, Check, ChevronDown, CircleHelp, CreditCard, ExternalLink, FileText, LayoutDashboard, Link2, Menu, Plus, Settings, ShieldCheck, Users, X } from 'lucide-react'
import { FormEvent, useEffect, useRef, useState } from 'react'

type UserPayload = { name: string; email: string; workspace?: { name: string; plan: string | null; subscriptionStatus: string | null; lmsLinks: { id: string; displayName: string; publicUrl: string; status: string }[] } | null }
type LmsLink = NonNullable<NonNullable<UserPayload['workspace']>['lmsLinks']>[number]
type Invoice = { number: string; amountCents: number; currency: string; status: string; createdAt: string; paidAt: string | null }
type UsageMetric = { value: number | null; accuracy: string }
type UsageMetrics = { teamMembers: UsageMetric; supportTickets: UsageMetric; linkChecks: UsageMetric; auditEvents: UsageMetric }

const nav = [
  { label: 'نظرة عامة', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'الاشتراك والفوترة', icon: CreditCard, href: '/app/subscription' },
  { label: 'الاستخدام', icon: FileText, href: '/app/usage' },
  { label: 'التقارير', icon: FileText, href: '/app/reports' },
  { label: 'رابط المنصة', icon: Link2, href: '/app/lms-connection' },
  { label: 'الفريق', icon: Users, href: '/app/team' },
  { label: 'الإعدادات', icon: Settings, href: '/app/settings' },
  { label: 'الأمان', icon: ShieldCheck, href: '/app/security' },
  { label: 'الإشعارات', icon: Bell, href: '/app/notifications' },
  { label: 'الدعم', icon: CircleHelp, href: '/support' },
]

export default function DashboardPage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<UserPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [link, setLink] = useState<LmsLink>()
  const [latestInvoice, setLatestInvoice] = useState<Invoice>()
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics>()
  const [showForm, setShowForm] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [publicUrl, setPublicUrl] = useState('')
  const [linkError, setLinkError] = useState('')
  const [saving, setSaving] = useState(false)
  const loadErrorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/auth/me', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('تعذر تحميل بيانات الحساب')
        return response.json()
      })
      .then((payload) => {
        if (!payload?.user) throw new Error('تعذر تحميل بيانات الحساب')
        setUser(payload.user)
        setLink(payload.user.workspace?.lmsLinks?.[0])
        setLoadError('')
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadError(error instanceof Error ? error.message : 'تعذر تحميل بيانات الحساب')
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (loadError) loadErrorRef.current?.focus()
  }, [loadError])

  useEffect(() => {
    let cancelled = false
    Promise.all([fetch('/api/invoices?limit=1', { cache: 'no-store' }), fetch('/api/usage', { cache: 'no-store' })])
      .then(async ([invoiceResponse, usageResponse]) => {
        const [invoicePayload, usagePayload] = await Promise.all([invoiceResponse.json(), usageResponse.json()])
        if (cancelled) return
        if (invoiceResponse.ok && invoicePayload.invoices?.[0]) setLatestInvoice(invoicePayload.invoices[0])
        if (usageResponse.ok && usagePayload.metrics) setUsageMetrics(usagePayload.metrics)
      })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [])

  async function addLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setLinkError('')
    try {
      const response = await fetch('/api/lms-link', { method: 'POST', cache: 'no-store', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ displayName, publicUrl }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'تعذر حفظ الرابط')
      setLink(payload.link); setShowForm(false); setDisplayName(''); setPublicUrl('')
    } catch (error) { setLinkError(error instanceof Error ? error.message : 'تعذر حفظ الرابط') } finally { setSaving(false) }
  }

  const name = user?.name || 'المدرس'
  const workspace = user?.workspace
  return (
    <main className="dashboard-page">
      <aside className={`app-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="app-sidebar-head"><Link href="/" className="brand"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><button type="button" className="sidebar-close" aria-label="إغلاق القائمة الجانبية" onClick={() => setMobileOpen(false)}><X size={17} /></button></div>
        <div className="workspace-switcher"><span className="workspace-avatar">{name.slice(0, 1)}</span><span><b>{workspace?.name || 'مساحة العمل'}</b><small>حساب المدرس</small></span><ChevronDown size={13} /></div>
        <small className="app-nav-label">المساحة الرئيسية</small>
        <nav className="app-nav">{nav.map(({ label, icon: Icon, href }, index) => <Link href={href} key={label} className={`app-nav-item ${index === 0 ? 'active' : ''}`}><Icon size={16} /><span>{label}</span>{index === 3 && <small>3</small>}</Link>)}</nav>
        <div className="app-sidebar-bottom"><div className="app-user"><span className="mini-avatar">{name.slice(0, 1)}</span><span><b>{name}</b><small>المالك</small></span></div><Link href="/app/profile" aria-label="فتح الملف الشخصي" title="الملف الشخصي"><Settings size={15} /></Link></div>
      </aside>
      {mobileOpen && <button type="button" className="sidebar-overlay" aria-label="إغلاق القائمة" onClick={() => setMobileOpen(false)} />}
      <section className="dashboard-main">
        <header className="dashboard-header"><button type="button" className="dashboard-menu" aria-label="فتح القائمة الجانبية" onClick={() => setMobileOpen(true)}><Menu size={19} /></button><div><span className="dashboard-date">مساحة عملك في مركزية</span><h1>صباح الخير، {name} <em>✦</em></h1></div><div className="dashboard-header-actions"><Link href="/app/notifications" className="notification-button" aria-label="فتح مركز الإشعارات" title="الإشعارات"><Bell size={17} /><i /></Link><Link href="/" className="button button-outline">العودة للموقع</Link></div></header>
        {loading && <div className="dashboard-alert" role="status" aria-live="polite"><div className="alert-icon"><Link2 size={16} /></div><div><b>جارٍ تحميل مساحة العمل</b><span>نجهز بيانات SaaS الخاصة بحسابك.</span></div></div>}
        {loadError && !loading && <div ref={loadErrorRef} tabIndex={-1} className="dashboard-alert" role="alert"><div className="alert-icon"><ShieldCheck size={16} /></div><div><b>تعذر تحميل بيانات الحساب</b><span>{loadError}</span></div><button type="button" className="button button-light" onClick={() => window.location.reload()}>إعادة المحاولة</button></div>}
        {!loading && !loadError && <div className="dashboard-alert"><div className="alert-icon"><Link2 size={16} /></div><div><b>{link ? 'رابط منصتك متصل' : 'أضف رابط منصتك التعليمية'}</b><span>{link ? 'يمكنك الوصول إلى منصتك من مكان واحد.' : 'حسابك نشط. اربط منصتك للوصول إليها من هنا.'}</span></div>{link ? <span className="connected-badge"><Check size={12} /> {link.status === 'REACHABLE' ? 'متاح' : 'محفوظ'}</span> : <button type="button" className="button button-light" onClick={() => setShowForm(true)}>إضافة رابط</button>}</div>}
        {showForm && <form className="dashboard-link-form" onSubmit={addLink}><label>اسم المنصة<input required value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="أكاديمية النور" /></label><label>الرابط العام HTTPS<input required type="url" value={publicUrl} onChange={(event) => setPublicUrl(event.target.value)} placeholder="https://academy.example.com" /></label><div><button type="submit" className="button button-dark" disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ الرابط'}</button><button type="button" className="button button-outline" onClick={() => setShowForm(false)}>إلغاء</button></div>{linkError && <p className="form-error">{linkError}</p>}</form>}
        <div className="dashboard-metrics"><article className="dash-card"><div className="dash-card-head"><span>الباقة الحالية</span><CreditCard size={16} /></div><strong>{workspace?.plan || 'غير محددة'}</strong><small>{workspace?.subscriptionStatus === 'TRIAL' ? 'تجربة مجانية نشطة' : 'حالة SaaS محفوظة في النظام'}</small><Link href="/app/subscription" className="dash-link">إدارة الباقة <ArrowLeft size={13} /></Link></article><article className="dash-card"><div className="dash-card-head"><span>حالة الحساب</span><ShieldCheck size={16} /></div><strong className="status-active"><i /> {workspace?.subscriptionStatus || 'قيد التهيئة'}</strong><small>بيانات الحساب مستقلة عن LMS</small><div className="status-bars"><i /><i /><i /><i /><i /></div></article><article className="dash-card"><div className="dash-card-head"><span>آخر فاتورة</span><FileText size={16} /></div><strong>{latestInvoice ? `${(latestInvoice.amountCents / 100).toFixed(2)} ${latestInvoice.currency}` : 'لا توجد'}</strong><small>{latestInvoice ? `الحالة: ${latestInvoice.status}` : 'ستظهر بعد أول فاتورة صادرة'}</small><Link href="/billing" className="dash-link">عرض الفواتير <ArrowLeft size={13} /></Link></article></div>
        <div className="dashboard-grid"><article className="dash-panel activity-panel"><div className="panel-heading"><div><b>نشاط الحساب</b><span>بيانات SaaS فقط</span></div><span className="period-button" aria-label="فترة النشاط الحالية">آخر 30 يومًا <ChevronDown size={13} /></span></div><div className="activity-chart"><div className="chart-axis"><span>100%</span><span>50%</span><span>0%</span></div><svg viewBox="0 0 600 175" preserveAspectRatio="none" aria-label="مخطط نشاط الحساب"><path d="M0 145 C50 132 64 138 105 112 S160 128 205 95 S260 117 300 76 S355 86 390 50 S455 73 490 37 S555 54 600 18" fill="none" stroke="#ec794e" strokeWidth="4" strokeLinecap="round" /><path d="M0 145 C50 132 64 138 105 112 S160 128 205 95 S260 117 300 76 S355 86 390 50 S455 73 490 37 S555 54 600 18 L600 175 L0 175Z" fill="url(#area)" opacity=".45" /><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#ec794e" stopOpacity=".25" /><stop offset="1" stopColor="#ec794e" stopOpacity="0" /></linearGradient></defs></svg><div className="chart-labels"><span>الأسبوع 1</span><span>الأسبوع 2</span><span>الأسبوع 3</span><span>الأسبوع 4</span></div></div></article><article className="dash-panel link-panel" id="link"><div className="panel-heading"><div><b>رابط المنصة</b><span>الوصول السريع</span></div><Link2 size={16} /></div>{link ? <div className="link-connected"><div className="link-success-icon"><Check size={18} /></div><b>{link.displayName}</b><small>{link.publicUrl}</small><a href={link.publicUrl} target="_blank" rel="noreferrer">فتح المنصة <ExternalLink size={13} /></a></div> : <div className="link-empty"><div className="empty-icon"><Link2 size={17} /></div><b>لم تتم إضافة رابط بعد</b><span>أضف رابط LMS الخاص بك للوصول السريع والتحقق من حالته.</span><button type="button" onClick={() => setShowForm(true)}><Plus size={13} /> إضافة رابط</button></div>}</article></div>
        <section className="dash-panel" aria-label="مؤشرات الحساب الحالية"><div className="panel-heading"><div><b>مؤشرات SaaS المقاسة</b><span>بيانات قاعدة SaaS فقط</span></div><FileText size={16} /></div><div className="workspace-stat-list"><div><span>أعضاء الفريق</span><strong>{usageMetrics?.teamMembers.value ?? 'غير متاح'}</strong></div><div><span>تذاكر الدعم</span><strong>{usageMetrics?.supportTickets.value ?? 'غير متاح'}</strong></div><div><span>فحوصات الرابط</span><strong>{usageMetrics?.linkChecks.value ?? 'غير متاح'}</strong></div><div><span>أحداث التدقيق</span><strong>{usageMetrics?.auditEvents.value ?? 'غير متاح'}</strong></div></div></section><div className="dashboard-footer-note"><ShieldCheck size={15} /> بياناتك في أمان · صلاحيات واضحة دائمًا <span>المصدر: SaaS فقط، دون قراءة تلقائية لبيانات LMS</span></div>
      </section>
    </main>
  )
}
