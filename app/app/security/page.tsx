'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, KeyRound, LogOut, MonitorSmartphone, RefreshCw, ShieldCheck, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

type ActiveSession = { id: string; ipAddress: string | null; device: string; createdAt: string; expiresAt: string }
type LoginHistoryEntry = { id: string; success: boolean; failureReason: string | null; ipAddress: string | null; device: string; createdAt: string }
type SessionInfo = { activeSessions: number; latestCreatedAt: string | null; latestExpiresAt: string | null; sessions: ActiveSession[]; loginHistory: LoginHistoryEntry[] }
type TwoFactorInfo = { enabled: boolean; enrollmentPending: boolean; requiredForStaff: boolean }
type Enrollment = { secret: string; otpauthUri: string }

function date(value: string | null) { return value ? new Date(value).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : 'غير متاح' }

const FAILURE_LABELS: Record<string, string> = {
  invalid_credentials: 'بيانات دخول غير صحيحة',
  '2fa_challenge_expired': 'جلسة تحقق منتهية',
  '2fa_code_invalid': 'رمز مصادقة غير صحيح',
}

function failureLabel(reason: string | null) { return (reason && FAILURE_LABELS[reason]) || 'محاولة فاشلة' }

export default function SecurityPage() {
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [twoFactor, setTwoFactor] = useState<TwoFactorInfo | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorBusy, setTwoFactorBusy] = useState(false)

  async function load() {
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/auth/logout-all', { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'تعذر قراءة الجلسات')
      setSession(payload)
      try {
        const twoFactorResponse = await fetch('/api/auth/2fa', { cache: 'no-store' })
        const twoFactorPayload = await twoFactorResponse.json().catch(() => ({}))
        if (twoFactorResponse.ok) setTwoFactor(twoFactorPayload)
      } catch { /* session visibility remains useful if 2FA status is temporarily unavailable */ }
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'تعذر قراءة الجلسات') } finally { setLoading(false) }
  }

  useEffect(() => { const timer = window.setTimeout(() => { void load() }, 0); return () => window.clearTimeout(timer) }, [])

  async function startTwoFactor() {
    setTwoFactorBusy(true); setError(''); setMessage('')
    try {
      const response = await fetch('/api/auth/2fa', { method: 'POST', cache: 'no-store', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'start' }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'تعذر بدء إعداد المصادقة الثنائية')
      setEnrollment({ secret: payload.secret, otpauthUri: payload.otpauthUri })
      setTwoFactor({ enabled: false, enrollmentPending: true, requiredForStaff: Boolean(twoFactor?.requiredForStaff) })
      setMessage('تم إنشاء سر الإعداد. أضفه إلى تطبيق المصادقة ثم أدخل الرمز المكون من 6 أرقام.')
    } catch (startError) { setError(startError instanceof Error ? startError.message : 'تعذر بدء إعداد المصادقة الثنائية') } finally { setTwoFactorBusy(false) }
  }

  async function confirmTwoFactor() {
    setTwoFactorBusy(true); setError(''); setMessage('')
    const action = twoFactor?.enabled ? 'disable' : 'enable'
    if (action === 'disable' && twoFactor?.requiredForStaff) { setError('المصادقة الثنائية إلزامية لحسابات Staff ولا يمكن إيقافها.'); setTwoFactorBusy(false); return }
    try {
      const response = await fetch('/api/auth/2fa', { method: 'POST', cache: 'no-store', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, code: twoFactorCode }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'تعذر التحقق من رمز المصادقة')
      setTwoFactor({ enabled: Boolean(payload.enabled), enrollmentPending: false, requiredForStaff: Boolean(twoFactor?.requiredForStaff) })
      setEnrollment(null)
      setTwoFactorCode('')
      setMessage(payload.enabled ? 'تم تفعيل المصادقة الثنائية.' : 'تم إيقاف المصادقة الثنائية.')
    } catch (verifyError) { setError(verifyError instanceof Error ? verifyError.message : 'تعذر التحقق من رمز المصادقة') } finally { setTwoFactorBusy(false) }
  }

  async function revokeAll() {
    setBusy(true); setError(''); setMessage('')
    try {
      const response = await fetch('/api/auth/logout-all', { method: 'POST', cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'تعذر إبطال الجلسات')
      setSession((previous) => ({ activeSessions: 0, latestCreatedAt: null, latestExpiresAt: null, sessions: [], loginHistory: previous?.loginHistory || [] }))
      setMessage(`تم إبطال ${payload.revoked || 0} جلسة. أعد تسجيل الدخول للمتابعة.`)
    } catch (revokeError) { setError(revokeError instanceof Error ? revokeError.message : 'تعذر إبطال الجلسات') } finally { setBusy(false) }
  }

  return <main className="billing-page"><header className="billing-header section-container"><Link href="/app/overview" className="brand" aria-label="العودة إلى مساحة العمل"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><Link href="/app/overview" className="button button-outline"><ArrowRight size={14} /> العودة للنظرة العامة</Link></header><section className="billing-content section-container"><div className="billing-heading"><div><span className="section-eyebrow"><span className="eyebrow-dot" />أمان الحساب</span><h1>حسابك محمي، <em>بوضوح.</em></h1><p>راجع جلسات SaaS الفعالة وأبطلها كلها عند الشك. لا تشمل هذه الشاشة أي جلسة دخول إلى LMS.</p></div><div className="billing-security"><ShieldCheck size={16} /><span>جلسة SaaS خاصة</span></div></div>{error && <div className="form-error" role="alert"><span>{error}</span><button type="button" className="text-button" onClick={() => void load()}><RefreshCw size={14} /> إعادة المحاولة</button></div>}{message && <div className="form-success" role="status">{message}</div>}<div className="dashboard-metrics usage-metrics"><article className="dash-card"><div className="dash-card-head"><span>الجلسات</span><ShieldCheck size={16} /></div><strong>{loading ? '...' : session?.activeSessions ?? 0}</strong><small>جلسات SaaS غير المنتهية حاليًا.</small><span className="connected-badge"><CheckCircle2 size={12} /> محمية</span></article><article className="dash-card"><div className="dash-card-head"><span>آخر إنشاء</span><KeyRound size={16} /></div><strong>{loading ? '...' : date(session?.latestCreatedAt || null)}</strong><small>آخر جلسة مسجلة للحساب.</small></article><article className="dash-card"><div className="dash-card-head"><span>الإبطال الجماعي</span><LogOut size={16} /></div><strong>متاح</strong><small>يبطل كل الجلسات ويطلب تسجيل الدخول من جديد.</small></article></div><section className="workspace-panel"><div className="workspace-panel-heading"><div><b>المصادقة الثنائية</b><span>أضف طبقة تحقق إضافية لحساب مركزية باستخدام تطبيق TOTP. لا نعرض السر إلا أثناء الإعداد.</span></div><ShieldCheck size={17} /></div>{twoFactor?.enabled ? <div className="workspace-next"><div><span className="connected-badge"><CheckCircle2 size={12} /> مفعلة</span><p>{twoFactor.requiredForStaff ? 'مفعلة وإلزامية لحسابات Staff.' : 'أدخل رمزًا حاليًا من تطبيق المصادقة إذا أردت إيقافها.'}</p></div>{!twoFactor.requiredForStaff && <form onSubmit={(event) => { event.preventDefault(); void confirmTwoFactor() }} className="inline-form"><input className="text-input" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value)} placeholder="رمز من 6 أرقام" aria-label="رمز المصادقة" /><button type="submit" className="button button-outline" disabled={twoFactorBusy || twoFactorCode.length !== 6}>{twoFactorBusy ? 'جارٍ التحقق...' : 'إيقاف المصادقة'}</button></form>}</div> : enrollment ? <div><p>أدخل هذا السر في تطبيق المصادقة، أو استخدم رابط الإعداد في تطبيق يدعم URI:</p><code className="safe-note" dir="ltr">{enrollment.secret}</code><p className="safe-note" dir="ltr">{enrollment.otpauthUri}</p><form onSubmit={(event) => { event.preventDefault(); void confirmTwoFactor() }} className="inline-form"><input className="text-input" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value)} placeholder="رمز من 6 أرقام" aria-label="رمز تفعيل المصادقة" /><button type="submit" className="button button-dark" disabled={twoFactorBusy || twoFactorCode.length !== 6}>{twoFactorBusy ? 'جارٍ التحقق...' : 'تفعيل المصادقة'}</button></form></div> : <div className="workspace-next"><p>المصادقة الثنائية غير مفعلة حاليًا.</p><button type="button" className="button button-dark" disabled={twoFactorBusy || loading} onClick={() => void startTwoFactor()}>{twoFactorBusy ? 'جارٍ إنشاء الإعداد...' : 'بدء إعداد المصادقة الثنائية'} <ShieldCheck size={14} /></button></div>}</section><section className="workspace-panel"><div className="workspace-panel-heading"><div><b>إدارة الجلسات</b><span>استخدم الإبطال الجماعي إذا دخلت من جهاز عام أو شككت في الجلسة.</span></div><ShieldCheck size={17} /></div><div className="workspace-next"><button type="button" className="button button-dark" disabled={busy || loading || !session?.activeSessions} onClick={() => void revokeAll()}>{busy ? 'جارٍ الإبطال...' : 'إبطال كل الجلسات'} <LogOut size={14} /></button><Link href="/app/profile" className="button button-outline">مراجعة الملف الشخصي</Link></div>{!loading && session?.sessions && session.sessions.length > 0 && <div className="audit-list">{session.sessions.map((item) => <div className="audit-row" key={item.id}><span>{date(item.createdAt)}</span><span><MonitorSmartphone size={13} /> {item.device}</span><small dir="ltr">{item.ipAddress || 'IP غير متاح'}</small></div>)}</div>}<p className="safe-note"><ShieldCheck size={15} /> كلمات المرور مجزأة، وعمليات الأمان الحساسة تسجل في سجل التدقيق.</p></section><section className="workspace-panel"><div className="workspace-panel-heading"><div><b>سجل تسجيل الدخول</b><span>آخر محاولات تسجيل الدخول الناجحة والفاشلة على حساب SaaS، مع الجهاز وعنوان IP عندما يكونان متاحين.</span></div><ShieldCheck size={17} /></div>{loading ? <p className="safe-note">جارٍ التحميل...</p> : session?.loginHistory && session.loginHistory.length > 0 ? <div className="audit-list">{session.loginHistory.map((item) => <div className="audit-row" key={item.id}><span>{date(item.createdAt)}</span><span>{item.success ? <CheckCircle2 size={13} /> : <XCircle size={13} />} {item.success ? 'دخول ناجح' : failureLabel(item.failureReason)} · {item.device}</span><small dir="ltr">{item.ipAddress || 'IP غير متاح'}</small></div>)}</div> : <p className="safe-note">لا يوجد سجل تسجيل دخول متاح بعد.</p>}</section><div className="billing-help"><ShieldCheck size={16} /><div><b>حدود أمنية صريحة</b><span>لا تنفذ مركزية تسجيل الدخول إلى LMS ولا تخزن أسرار قواعد بياناته. أي تكامل مستقبلي يجب أن يستخدم عقدًا رسميًا بصلاحيات محددة.</span></div></div></section></main>
}
