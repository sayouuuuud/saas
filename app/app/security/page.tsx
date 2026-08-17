'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, KeyRound, LogOut, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

type SessionInfo = { activeSessions: number; latestCreatedAt: string | null; latestExpiresAt: string | null }

function date(value: string | null) { return value ? new Date(value).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : 'غير متاح' }

export default function SecurityPage() {
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/auth/logout-all', { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'تعذر قراءة الجلسات')
      setSession(payload)
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'تعذر قراءة الجلسات') } finally { setLoading(false) }
  }

  useEffect(() => { const timer = window.setTimeout(() => { void load() }, 0); return () => window.clearTimeout(timer) }, [])

  async function revokeAll() {
    setBusy(true); setError(''); setMessage('')
    try {
      const response = await fetch('/api/auth/logout-all', { method: 'POST', cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'تعذر إبطال الجلسات')
      setSession({ activeSessions: 0, latestCreatedAt: null, latestExpiresAt: null })
      setMessage(`تم إبطال ${payload.revoked || 0} جلسة. أعد تسجيل الدخول للمتابعة.`)
    } catch (revokeError) { setError(revokeError instanceof Error ? revokeError.message : 'تعذر إبطال الجلسات') } finally { setBusy(false) }
  }

  return <main className="billing-page"><header className="billing-header section-container"><Link href="/app/overview" className="brand" aria-label="العودة إلى مساحة العمل"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><Link href="/app/overview" className="button button-outline"><ArrowRight size={14} /> العودة للنظرة العامة</Link></header><section className="billing-content section-container"><div className="billing-heading"><div><span className="section-eyebrow"><span className="eyebrow-dot" />أمان الحساب</span><h1>حسابك محمي، <em>بوضوح.</em></h1><p>راجع جلسات SaaS الفعالة وأبطلها كلها عند الشك. لا تشمل هذه الشاشة أي جلسة دخول إلى LMS.</p></div><div className="billing-security"><ShieldCheck size={16} /><span>جلسة SaaS خاصة</span></div></div>{error && <div className="form-error" role="alert"><span>{error}</span><button type="button" className="text-button" onClick={() => void load()}><RefreshCw size={14} /> إعادة المحاولة</button></div>}{message && <div className="form-success" role="status">{message}</div>}<div className="dashboard-metrics usage-metrics"><article className="dash-card"><div className="dash-card-head"><span>الجلسات</span><ShieldCheck size={16} /></div><strong>{loading ? '...' : session?.activeSessions ?? 0}</strong><small>جلسات SaaS غير المنتهية حاليًا.</small><span className="connected-badge"><CheckCircle2 size={12} /> محمية</span></article><article className="dash-card"><div className="dash-card-head"><span>آخر إنشاء</span><KeyRound size={16} /></div><strong>{loading ? '...' : date(session?.latestCreatedAt || null)}</strong><small>آخر جلسة مسجلة للحساب.</small></article><article className="dash-card"><div className="dash-card-head"><span>الإبطال الجماعي</span><LogOut size={16} /></div><strong>متاح</strong><small>يبطل كل الجلسات ويطلب تسجيل الدخول من جديد.</small></article></div><section className="workspace-panel"><div className="workspace-panel-heading"><div><b>إدارة الجلسات</b><span>استخدم الإبطال الجماعي إذا دخلت من جهاز عام أو شككت في الجلسة.</span></div><ShieldCheck size={17} /></div><div className="workspace-next"><button type="button" className="button button-dark" disabled={busy || loading || !session?.activeSessions} onClick={() => void revokeAll()}>{busy ? 'جارٍ الإبطال...' : 'إبطال كل الجلسات'} <LogOut size={14} /></button><Link href="/app/profile" className="button button-outline">مراجعة الملف الشخصي</Link></div><p className="safe-note"><ShieldCheck size={15} /> كلمات المرور مجزأة، وعمليات الأمان الحساسة تسجل في سجل التدقيق.</p></section><div className="billing-help"><ShieldCheck size={16} /><div><b>حدود أمنية صريحة</b><span>لا تنفذ مركزية تسجيل الدخول إلى LMS ولا تخزن أسرار قواعد بياناته. أي تكامل مستقبلي يجب أن يستخدم عقدًا رسميًا بصلاحيات محددة.</span></div></div></section></main>
}
