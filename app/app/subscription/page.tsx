'use client'

import Link from 'next/link'
import { ArrowRight, CalendarDays, Check, CreditCard, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Subscription = {
  id: string
  status: string
  billingCycle: string
  startedAt: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  cancelledAt: string | null
  plan: { code: string; name: string; description: string; monthlyCents: number; yearlyCents: number; supportTier: string } | null
  events: Array<{ id: string; type: string; fromStatus: string | null; toStatus: string | null; createdAt: string }>
}

const statusLabels: Record<string, string> = {
  TRIAL: 'تجريبية',
  ACTIVE: 'نشطة',
  PAST_DUE: 'متأخرة الدفع',
  GRACE_PERIOD: 'فترة سماح',
  SUSPENDED: 'موقوفة',
  CANCELLED: 'ملغاة',
  PAYMENT_REVIEW: 'قيد المراجعة',
}

const eventLabels: Record<string, string> = {
  CREATED: 'إنشاء الاشتراك',
  PAYMENT_CONFIRMED: 'تأكيد الدفع',
  CANCEL_REQUESTED: 'طلب الإلغاء',
  REACTIVATED: 'إعادة التفعيل',
  PLAN_CHANGED: 'تغيير الخطة',
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'
}

function money(cents: number, cycle: string) {
  return `$${(cents / 100).toFixed(2)} / ${cycle === 'YEARLY' ? 'سنة' : 'شهر'}`
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const errorRef = useRef<HTMLDivElement>(null)

  async function loadSubscription(signal?: AbortSignal) {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/subscription', { cache: 'no-store', signal })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'تعذر تحميل بيانات الاشتراك')
      setSubscription(payload.subscription ?? null)
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === 'AbortError') return
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل بيانات الاشتراك')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => { void loadSubscription(controller.signal) }, 0)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [])

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  async function mutate(action: 'cancel' | 'reactivate') {
    if (action === 'cancel' && !window.confirm('سيستمر اشتراكك حتى نهاية الفترة الحالية. هل تريد جدولة الإلغاء؟')) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch(`/api/subscription/${action}`, { method: 'POST', cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'تعذر تحديث الاشتراك')
      setSubscription(payload.subscription ?? subscription)
      setMessage(payload.unchanged ? 'لم يتغير الاشتراك؛ الإجراء المطلوب مفعّل بالفعل.' : action === 'cancel' ? 'تمت جدولة الإلغاء لنهاية الفترة الحالية.' : 'تمت إعادة تفعيل الاشتراك.')
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'تعذر تحديث الاشتراك')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="billing-page">
      <header className="billing-header section-container">
        <Link href="/dashboard" className="brand" aria-label="العودة إلى لوحة التحكم"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link>
        <Link href="/dashboard" className="button button-outline"><ArrowRight size={14} /> العودة للوحة التحكم</Link>
      </header>
      <section className="billing-content section-container">
        <div className="billing-heading"><div><span className="section-eyebrow"><span className="eyebrow-dot" />حسابك</span><h1>الاشتراك، <em>بكل وضوح.</em></h1><p>راجع حالة اشتراك SaaS وفترته وخطة الحساب. هذه البيانات تخص مركزية فقط ولا تمثل صحة نظام LMS.</p></div><div className="billing-security"><ShieldCheck size={16} /><span>بيانات SaaS قابلة للمراجعة</span></div></div>
        {error && <div ref={errorRef} tabIndex={-1} className="form-error" role="alert"><span>{error}</span><button type="button" className="text-button" onClick={() => void loadSubscription()} disabled={loading}><RefreshCw size={14} /> إعادة المحاولة</button></div>}
        {message && <div className="billing-help" role="status"><Check size={17} /><span>{message}</span></div>}
        {loading ? <div className="invoice-empty" role="status">جارٍ تحميل بيانات الاشتراك...</div> : subscription ? <>
          <div className="billing-current-grid">
            <article className="current-plan-card"><div className="current-card-top"><span className="plan-name">{subscription.plan?.name || 'الخطة الحالية'}</span><span className="current-pill"><i /> {statusLabels[subscription.status] || subscription.status}</span></div><p>{subscription.plan?.description || 'تفاصيل الخطة غير متاحة حاليًا.'}</p><div className="current-price"><strong>{subscription.plan ? money(subscription.billingCycle === 'YEARLY' ? subscription.plan.yearlyCents : subscription.plan.monthlyCents, subscription.billingCycle) : '—'}</strong></div><small>{subscription.cancelAtPeriodEnd ? `ينتهي في ${formatDate(subscription.currentPeriodEnd)} بعد الإلغاء المجدول.` : `الفترة الحالية حتى ${formatDate(subscription.currentPeriodEnd)}.`}</small><div className="billing-plan-actions"><Link href="/billing" className="button button-light"><CreditCard size={14} /> إدارة الفوترة</Link>{subscription.cancelAtPeriodEnd ? <button type="button" className="button button-dark" onClick={() => void mutate('reactivate')} disabled={busy}>{busy ? 'جارٍ...' : 'إعادة التفعيل'}</button> : <button type="button" className="button button-outline" onClick={() => void mutate('cancel')} disabled={busy}>{busy ? 'جارٍ...' : 'إلغاء بنهاية الفترة'}</button>}</div></article>
            <article className="payment-card"><div className="billing-card-title"><span>ملخص الفترة</span><CalendarDays size={17} /></div><div className="payment-method"><div><b>بدأ الاشتراك</b><small>{formatDate(subscription.startedAt)}</small></div></div><div className="payment-method"><div><b>دورة الفوترة</b><small>{subscription.billingCycle === 'YEARLY' ? 'سنوية' : 'شهرية'}</small></div></div><div className="payment-note"><ShieldCheck size={13} /> لا نخزن بيانات البطاقة</div></article>
          </div>
          <section className="invoice-section" aria-labelledby="subscription-history"><div className="invoice-heading"><div><h2 id="subscription-history">سجل حالة الاشتراك</h2><p>أحداث SaaS المسجلة للحساب، مع أحدث الأحداث أولًا.</p></div></div><div className="invoice-table">{subscription.events.length ? subscription.events.map((event) => <div className="invoice-row" key={event.id}><span>{eventLabels[event.type] || event.type}</span><span>{formatDate(event.createdAt)}</span><span>{event.fromStatus ? `${statusLabels[event.fromStatus] || event.fromStatus} ← ` : ''}{statusLabels[event.toStatus || ''] || event.toStatus || '—'}</span><span className="paid-status"><Check size={12} /> موثق</span></div>) : <div className="invoice-empty">لا توجد أحداث سابقة لهذا الاشتراك.</div>}</div></section>
        </> : <div className="invoice-empty" role="status">لا يوجد اشتراك بعد. اختر خطة من صفحة الفوترة لبدء اشتراك SaaS.</div>}
      </section>
    </main>
  )
}
