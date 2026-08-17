'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, ChevronDown, CreditCard, Download, FileText, Link2, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

type Plan = { id: string; code: string; name: string; monthlyCents: number; yearlyCents: number; description: string }
type Invoice = { id: string; number: string; createdAt: string; amountCents: number; status: string }

function money(cents: number) { return `$${(cents / 100).toFixed(2)}` }

export default function BillingPage() {
  const [annual, setAnnual] = useState(false)
  const [showPlans, setShowPlans] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [message, setMessage] = useState('')
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    async function loadBillingData() {
      try {
        const [plansResponse, invoicesResponse] = await Promise.all([fetch('/api/plans'), fetch('/api/invoices')])
        if (!plansResponse.ok || !invoicesResponse.ok) throw new Error('تعذر تحميل بيانات الفوترة. تحقق من تسجيل الدخول ثم أعد المحاولة.')
        const [planPayload, invoicePayload] = await Promise.all([plansResponse.json(), invoicesResponse.json()])
        if (!active) return
        setPlans(planPayload.plans || [])
        setInvoices(invoicePayload.invoices || [])
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : 'تعذر تحميل بيانات الفوترة')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadBillingData()
    return () => { active = false }
  }, [])

  async function choosePlan(planCode: string) {
    setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/checkout/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ planCode, billingCycle: annual ? 'YEARLY' : 'MONTHLY' }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'تعذر بدء الدفع')
      setMessage('تم تحديث الاشتراك في وضع الاختبار المحلي. اربط بوابة دفع حقيقية قبل الإنتاج.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'تعذر بدء الدفع') } finally { setBusy(false) }
  }

  const current = plans.find((plan) => plan.code === 'growth') || plans[1]
  return (
    <main className="billing-page">
      <header className="billing-header section-container"><Link href="/dashboard" className="brand"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><Link href="/dashboard" className="button button-outline"><ArrowRight size={14} /> العودة للوحة التحكم</Link></header>
      <section className="billing-content section-container">
        <div className="billing-heading"><div><span className="section-eyebrow"><span className="eyebrow-dot" />الاشتراك والفوترة</span><h1>اشتراكك، <em>بكل وضوح.</em></h1><p>تابع باقتك الحالية، موعد التجديد، وطريقة الدفع والفواتير السابقة من مساحة واحدة.</p></div><div className="billing-security"><ShieldCheck size={16} /><span>دفع آمن وبيانات واضحة</span></div></div>
        {loadError && <p className="form-error" role="alert">{loadError}</p>}
        <div className="billing-current-grid"><article className="current-plan-card"><div className="current-card-top"><span className="plan-name">{loading ? 'جارٍ التحميل...' : current?.name || 'Growth'}</span><span className="current-pill"><i /> نشطة</span></div><p>{loading ? 'نحمّل تفاصيل الباقة الحالية.' : current?.description || 'للمدرسين الذين يريدون مساحة عمل أكثر تنظيمًا.'}</p><div className="current-price"><strong>{money(current?.monthlyCents || 3100)}</strong><span>/ شهر</span></div><small>التجديد القادم بعد تفعيل الاشتراك من مزود الدفع.</small><div className="plan-progress"><div><span>استخدام مساحة العمل</span><b>3 / 5 أعضاء</b></div><div className="progress-track"><i /></div></div><button type="button" className="button button-light" disabled={loading || !!loadError} onClick={() => setShowPlans(!showPlans)}>{showPlans ? 'إخفاء الخطط' : 'تغيير الباقة'} <ChevronDown size={14} /></button></article><article className="payment-card"><div className="billing-card-title"><span>طريقة الدفع</span><CreditCard size={17} /></div><div className="payment-method"><div className="mastercard"><i /><i /></div><div><b>لا توجد بطاقة محفوظة</b><small>يُخزن مرجع المزود فقط، وليس بيانات البطاقة.</small></div><button type="button" className="text-button" aria-label="إضافة طريقة دفع">إضافة</button></div><div className="payment-note"><Check size={13} /> لا تُرسل بيانات حساسة إلى تذاكر الدعم</div></article></div>
        {showPlans && <div className="billing-plan-switcher"><div><b>اختر ما يناسب مرحلتك القادمة</b><span>الدفع الحقيقي يحتاج مزودًا مهيأً. الوضع المحلي لا يُستخدم في الإنتاج.</span></div><div className="billing-plan-actions"><button type="button" className={annual ? '' : 'selected'} aria-pressed={!annual} onClick={() => setAnnual(false)}>شهري</button><button type="button" className={annual ? 'selected' : ''} aria-pressed={annual} onClick={() => setAnnual(true)}>سنوي <em>وفر 20%</em></button></div><div className="mini-plans">{plans.map((plan) => <div className={plan.code === 'growth' ? 'mini-plan-featured' : ''} key={plan.id}><b>{plan.name}</b><strong>{money(annual ? plan.yearlyCents : plan.monthlyCents)}</strong><button type="button" disabled={busy} onClick={() => choosePlan(plan.code)}>{busy ? 'جارٍ...' : plan.code === 'growth' ? 'الباقة الحالية' : 'اختيار'}</button></div>)}</div>{message && <p className="form-error" role="status">{message}</p>}</div>}
        <div className="invoice-section"><div className="invoice-heading"><div><h2>الفواتير السابقة</h2><p>سجل واضح بكل المدفوعات والتجديدات.</p></div><button type="button" className="button button-outline" disabled={!invoices.length}><Download size={14} /> تصدير السجل</button></div><div className="invoice-table"><div className="invoice-row invoice-table-head"><span>رقم الفاتورة</span><span>التاريخ</span><span>المبلغ</span><span>الحالة</span><span /></div>{loading ? <div className="invoice-empty" role="status">جارٍ تحميل الفواتير...</div> : invoices.length ? invoices.map((invoice) => <div className="invoice-row" key={invoice.id}><span className="invoice-id"><FileText size={15} /> {invoice.number}</span><span>{new Date(invoice.createdAt).toLocaleDateString('ar-EG')}</span><span dir="ltr">{money(invoice.amountCents)}</span><span className="paid-status"><Check size={12} /> {invoice.status === 'PAID' ? 'مدفوعة' : invoice.status}</span><button type="button" className="download-button" aria-label={`تحميل ${invoice.number}`}><Download size={14} /></button></div>) : <div className="invoice-empty">لا توجد فواتير بعد. ستظهر هنا بعد تأكيد دفع اشتراك SaaS.</div>}</div></div>
        <div className="billing-help"><div className="billing-help-icon"><Link2 size={16} /></div><div><b>هل تحتاج إلى مساعدة في اشتراكك؟</b><span>فريق الدعم جاهز لمراجعة الفاتورة أو الإجابة عن أي سؤال.</span></div><Link href="/support" className="text-link">تواصل مع الدعم <ArrowLeft size={14} /></Link></div>
      </section>
    </main>
  )
}
