'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, ChevronDown, CreditCard, Download, FileText, Link2, Plus, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'

type Plan = { id: string; code: string; name: string; monthlyCents: number; yearlyCents: number; description: string }
type Invoice = { id: string; number: string; createdAt: string; amountCents: number; status: string }
type PaymentMethod = { id: string; brand: string; last4: string; expiryMonth: number; expiryYear: number; isDefault: boolean }
type BillingProfile = { billingCompany: string; billingContactName: string; billingContactEmail: string; billingTaxId: string; billingAddress: string; billingCity: string; billingCountry: string }
const emptyBillingProfile: BillingProfile = { billingCompany: '', billingContactName: '', billingContactEmail: '', billingTaxId: '', billingAddress: '', billingCity: '', billingCountry: '' }

const invoiceStatusLabels: Record<string, string> = {
  PAID: 'مدفوعة',
  OPEN: 'مستحقة',
  VOID: 'ملغاة',
  UNPAID: 'غير مدفوعة',
}

function money(cents: number) { return `$${(cents / 100).toFixed(2)}` }

function csvCell(value: string | number) { return `"${String(value).replaceAll('"', '""')}"` }

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\n')}`
  const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
}

export default function BillingPage() {
  const [annual, setAnnual] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [showPlans, setShowPlans] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [catalogDegraded, setCatalogDegraded] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [paymentError, setPaymentError] = useState('')
  const [paymentBusy, setPaymentBusy] = useState(false)
  const [paymentBrand, setPaymentBrand] = useState('Visa')
  const [paymentLast4, setPaymentLast4] = useState('')
  const [paymentMonth, setPaymentMonth] = useState('')
  const [paymentYear, setPaymentYear] = useState('')
  const [billingProfile, setBillingProfile] = useState<BillingProfile>(emptyBillingProfile)
  const [billingProfileError, setBillingProfileError] = useState('')
  const [billingProfileBusy, setBillingProfileBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [invoicesMoreLoading, setInvoicesMoreLoading] = useState(false)
  const [invoiceMoreError, setInvoiceMoreError] = useState('')
  const [invoicesNextOffset, setInvoicesNextOffset] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  const loadControllerRef = useRef<AbortController | null>(null)
  const invoicesControllerRef = useRef<AbortController | null>(null)
  const loadBillingData = useCallback(async () => {
    loadControllerRef.current?.abort()
    invoicesControllerRef.current?.abort()
    setInvoicesMoreLoading(false)
    setInvoiceMoreError('')
    const controller = new AbortController()
    loadControllerRef.current = controller
    setLoading(true)
    setLoadError('')
    try {
      const [plansResponse, invoicesResponse] = await Promise.all([
        fetch('/api/plans', { cache: 'no-store', signal: controller.signal }),
        fetch('/api/invoices?limit=25&offset=0', { cache: 'no-store', signal: controller.signal }),
      ])
      if (!plansResponse.ok || !invoicesResponse.ok) throw new Error('تعذر تحميل بيانات الفوترة. تحقق من تسجيل الدخول ثم أعد المحاولة.')
      const [planPayload, invoicePayload] = await Promise.all([plansResponse.json(), invoicesResponse.json()])
      if (controller.signal.aborted) return
      setPlans(planPayload.plans || [])
      setCatalogDegraded(planPayload.degraded === true)
      setInvoices(invoicePayload.invoices || [])
      setInvoicesNextOffset(typeof invoicePayload.pagination?.nextOffset === 'number' ? invoicePayload.pagination.nextOffset : null)
    } catch (error) {
      if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : 'تعذر تحميل بيانات الفوترة')
    } finally {
      if (!controller.signal.aborted && loadControllerRef.current === controller) {
        setLoading(false)
        loadControllerRef.current = null
      }
    }
  }, [])

  const loadMoreInvoices = useCallback(async () => {
    if (invoicesNextOffset === null) return
    invoicesControllerRef.current?.abort()
    const controller = new AbortController()
    invoicesControllerRef.current = controller
    setInvoicesMoreLoading(true)
    setInvoiceMoreError('')
    try {
      const response = await fetch(`/api/invoices?limit=25&offset=${invoicesNextOffset}`, { cache: 'no-store', signal: controller.signal })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'تعذر تحميل فواتير أقدم')
      if (controller.signal.aborted) return
      setInvoices((current) => [...current, ...(payload.invoices || [])])
      setInvoicesNextOffset(typeof payload.pagination?.nextOffset === 'number' ? payload.pagination.nextOffset : null)
    } catch (error) {
      if (!controller.signal.aborted) setInvoiceMoreError(error instanceof Error ? error.message : 'تعذر تحميل فواتير أقدم')
    } finally {
      if (!controller.signal.aborted && invoicesControllerRef.current === controller) {
        setInvoicesMoreLoading(false)
        invoicesControllerRef.current = null
      }
    }
  }, [invoicesNextOffset])

  const loadBillingProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/billing/profile', { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'تعذر تحميل ملف الفوترة')
      setBillingProfile({ ...emptyBillingProfile, ...(payload.profile || {}) })
    } catch (error) { setBillingProfileError(error instanceof Error ? error.message : 'تعذر تحميل ملف الفوترة') }
  }, [])

  const loadPaymentMethods = useCallback(async () => {
    try {
      const response = await fetch('/api/billing/payment-methods', { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'تعذر تحميل طرق الدفع')
      setPaymentMethods(payload.paymentMethods || [])
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'تعذر تحميل طرق الدفع')
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadBillingData(); void loadPaymentMethods(); void loadBillingProfile() }, 0)
    return () => {
      window.clearTimeout(timer)
      loadControllerRef.current?.abort()
      invoicesControllerRef.current?.abort()
    }
  }, [loadBillingData, loadPaymentMethods, loadBillingProfile])

  async function saveBillingProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBillingProfileBusy(true); setBillingProfileError('')
    try {
      const response = await fetch('/api/billing/profile', { method: 'PATCH', cache: 'no-store', headers: { 'content-type': 'application/json' }, body: JSON.stringify(billingProfile) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'تعذر حفظ ملف الفوترة')
      setBillingProfile({ ...emptyBillingProfile, ...(payload.profile || {}) })
    } catch (error) { setBillingProfileError(error instanceof Error ? error.message : 'تعذر حفظ ملف الفوترة') } finally { setBillingProfileBusy(false) }
  }

  async function savePaymentMethod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPaymentBusy(true); setPaymentError('')
    try {
      const response = await fetch('/api/billing/payment-methods', { method: 'POST', cache: 'no-store', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ brand: paymentBrand, last4: paymentLast4, expiryMonth: paymentMonth, expiryYear: paymentYear, default: paymentMethods.length === 0 }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'تعذر حفظ طريقة الدفع')
      setPaymentMethods((current) => [payload.paymentMethod, ...current.map((method) => ({ ...method, isDefault: payload.paymentMethod.isDefault ? false : method.isDefault }))])
      setPaymentLast4(''); setPaymentMonth(''); setPaymentYear('')
    } catch (error) { setPaymentError(error instanceof Error ? error.message : 'تعذر حفظ طريقة الدفع') } finally { setPaymentBusy(false) }
  }

  async function removePaymentMethod(id: string) {
    setPaymentBusy(true); setPaymentError('')
    try {
      const response = await fetch('/api/billing/payment-methods', { method: 'DELETE', cache: 'no-store', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'تعذر حذف طريقة الدفع')
      await loadPaymentMethods()
    } catch (error) { setPaymentError(error instanceof Error ? error.message : 'تعذر حذف طريقة الدفع') } finally { setPaymentBusy(false) }
  }

  function exportInvoices() {
    downloadCsv('centralia-invoices.csv', [
      ['رقم الفاتورة', 'التاريخ', 'المبلغ', 'الحالة'],
      ...invoices.map((invoice) => [invoice.number, new Date(invoice.createdAt).toLocaleDateString('ar-EG'), money(invoice.amountCents), invoice.status]),
    ])
  }

  function downloadInvoice(invoice: Invoice) {
    downloadCsv(`${invoice.number}.csv`, [['رقم الفاتورة', 'التاريخ', 'المبلغ', 'الحالة'], [invoice.number, new Date(invoice.createdAt).toLocaleDateString('ar-EG'), money(invoice.amountCents), invoice.status]])
  }

  async function choosePlan(planCode: string) {
    setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/checkout/session', { method: 'POST', cache: 'no-store', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ planCode, billingCycle: annual ? 'YEARLY' : 'MONTHLY', couponCode: couponCode.trim() || undefined }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'تعذر بدء الدفع')
      setMessage(payload.coupon ? `تم تحديث الاشتراك محليًا وتطبيق خصم ${payload.coupon.percentOff}% (${money(payload.coupon.discountCents)}). اربط بوابة دفع حقيقية قبل الإنتاج.` : 'تم تحديث الاشتراك في وضع الاختبار المحلي. اربط بوابة دفع حقيقية قبل الإنتاج.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'تعذر بدء الدفع') } finally { setBusy(false) }
  }

  const current = plans.find((plan) => plan.code === 'growth') || plans[1]
  return (
    <main className="billing-page">
      <header className="billing-header section-container"><Link href="/dashboard" className="brand"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><Link href="/dashboard" className="button button-outline"><ArrowRight size={14} /> العودة للوحة التحكم</Link></header>
      <section className="billing-content section-container">
        <div className="billing-heading"><div><span className="section-eyebrow"><span className="eyebrow-dot" />الاشتراك والفوترة</span><h1>اشتراكك، <em>بكل وضوح.</em></h1><p>تابع باقتك الحالية، موعد التجديد، وطريقة الدفع والفواتير السابقة من مساحة واحدة.</p></div><div className="billing-security"><ShieldCheck size={16} /><span>دفع آمن وبيانات واضحة</span></div></div>
        {loadError && <div className="form-error" role="alert"><span>{loadError}</span><button type="button" className="text-button" onClick={() => void loadBillingData()} disabled={loading}><RefreshCw size={14} /> إعادة المحاولة</button></div>}
        {catalogDegraded && <div className="form-error" role="status"><span>بيانات الخطط غير متاحة مؤقتًا. يمكنك إعادة المحاولة الآن، ولن تتأثر بيانات اشتراكك الحالية.</span><button type="button" className="text-button" onClick={() => void loadBillingData()} disabled={loading}><RefreshCw size={14} /> إعادة المحاولة</button></div>}
        <div className="billing-current-grid"><article className="current-plan-card"><div className="current-card-top"><span className="plan-name">{loading ? 'جارٍ التحميل...' : current?.name || 'Growth'}</span><span className="current-pill"><i /> نشطة</span></div><p>{loading ? 'نحمّل تفاصيل الباقة الحالية.' : current?.description || 'للمدرسين الذين يريدون مساحة عمل أكثر تنظيمًا.'}</p><div className="current-price"><strong>{money(current?.monthlyCents || 3100)}</strong><span>/ شهر</span></div><small>التجديد القادم بعد تفعيل الاشتراك من مزود الدفع.</small><div className="plan-progress"><div><span>استخدام مساحة العمل</span><b>3 / 5 أعضاء</b></div><div className="progress-track"><i /></div></div><button type="button" className="button button-light" disabled={loading || !!loadError || catalogDegraded} onClick={() => setShowPlans(!showPlans)}>{showPlans ? 'إخفاء الخطط' : 'تغيير الباقة'} <ChevronDown size={14} /></button></article><article className="payment-card"><div className="billing-card-title"><span>طريقة الدفع</span><CreditCard size={17} /></div><div className="payment-method"><div className="mastercard"><i /><i /></div><div><b>لا توجد بطاقة محفوظة</b><small>يُخزن مرجع المزود فقط، وليس بيانات البطاقة.</small></div><button type="button" className="text-button" aria-label="إضافة طريقة دفع" disabled title="تتوفر بعد ربط مزود دفع حقيقي">إضافة</button></div><div className="payment-note"><Check size={13} /> لا تُرسل بيانات حساسة إلى تذاكر الدعم</div></article></div>
        {showPlans && <div className="billing-plan-switcher"><div><b>اختر ما يناسب مرحلتك القادمة</b><span>الدفع الحقيقي يحتاج مزودًا مهيأً. الوضع المحلي لا يُستخدم في الإنتاج.</span></div><label className="coupon-field">كود الخصم (اختياري)<input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 40))} placeholder="WELCOME10" maxLength={40} /></label><div className="billing-plan-actions"><button type="button" className={annual ? '' : 'selected'} aria-pressed={!annual} onClick={() => setAnnual(false)}>شهري</button><button type="button" className={annual ? 'selected' : ''} aria-pressed={annual} onClick={() => setAnnual(true)}>سنوي <em>وفر 20%</em></button></div><div className="mini-plans">{plans.map((plan) => <div className={plan.code === 'growth' ? 'mini-plan-featured' : ''} key={plan.id}><b>{plan.name}</b><strong>{money(annual ? plan.yearlyCents : plan.monthlyCents)}</strong><button type="button" disabled={busy} onClick={() => choosePlan(plan.code)}>{busy ? 'جارٍ...' : plan.code === 'growth' ? 'الباقة الحالية' : 'اختيار'}</button></div>)}</div>{message && <p className="form-error" role="status">{message}</p>}</div>}
        <section className="payment-methods-section"><div className="invoice-heading"><div><h2>ملف الفوترة</h2><p>بيانات الشركة والجهة التي تظهر في فواتير SaaS. لا تُحفظ بيانات بطاقة أو محتوى تعليمي هنا.</p></div><FileText size={18} /></div>{billingProfileError && <p className="form-error" role="alert">{billingProfileError}</p>}<form className="payment-method-form" onSubmit={saveBillingProfile}><label>اسم الشركة<input value={billingProfile.billingCompany} onChange={(event) => setBillingProfile((current) => ({ ...current, billingCompany: event.target.value }))} maxLength={160} /></label><label>اسم جهة الاتصال<input value={billingProfile.billingContactName} onChange={(event) => setBillingProfile((current) => ({ ...current, billingContactName: event.target.value }))} maxLength={120} /></label><label>بريد الفوترة<input type="email" value={billingProfile.billingContactEmail} onChange={(event) => setBillingProfile((current) => ({ ...current, billingContactEmail: event.target.value }))} maxLength={254} /></label><label>الرقم الضريبي<input value={billingProfile.billingTaxId} onChange={(event) => setBillingProfile((current) => ({ ...current, billingTaxId: event.target.value }))} maxLength={80} /></label><label>العنوان<input value={billingProfile.billingAddress} onChange={(event) => setBillingProfile((current) => ({ ...current, billingAddress: event.target.value }))} maxLength={240} /></label><label>المدينة<input value={billingProfile.billingCity} onChange={(event) => setBillingProfile((current) => ({ ...current, billingCity: event.target.value }))} maxLength={120} /></label><label>الدولة<input value={billingProfile.billingCountry} onChange={(event) => setBillingProfile((current) => ({ ...current, billingCountry: event.target.value }))} maxLength={80} /></label><button type="submit" className="button button-dark" disabled={billingProfileBusy}>{billingProfileBusy ? 'جارٍ الحفظ...' : 'حفظ ملف الفوترة'}</button></form></section>
        <section className="payment-methods-section"><div className="invoice-heading"><div><h2>مراجع طرق الدفع</h2><p>نحفظ آخر أربعة أرقام والمرجع الخارجي فقط، ولا نقبل رقم البطاقة الكامل.</p></div><CreditCard size={18} /></div>{paymentError && <p className="form-error" role="alert">{paymentError}</p>}<div className="payment-methods-list">{paymentMethods.length ? paymentMethods.map((method) => <div className="payment-method-row" key={method.id}><CreditCard size={16} /><span>{method.brand} •••• {method.last4}</span><small>{String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear}{method.isDefault ? ' · افتراضية' : ''}</small><button type="button" className="text-button" disabled={paymentBusy} onClick={() => void removePaymentMethod(method.id)}><Trash2 size={14} /> حذف</button></div>) : <div className="invoice-empty">لا توجد طريقة دفع محفوظة. الوضع المحلي يحفظ مرجعًا تجريبيًا فقط.</div>}</div><form className="payment-method-form" onSubmit={savePaymentMethod}><label>النوع<input value={paymentBrand} onChange={(event) => setPaymentBrand(event.target.value)} maxLength={40} required /></label><label>آخر 4 أرقام<input inputMode="numeric" pattern="[0-9]{4}" value={paymentLast4} onChange={(event) => setPaymentLast4(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" required /></label><label>الشهر<input inputMode="numeric" value={paymentMonth} onChange={(event) => setPaymentMonth(event.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="12" required /></label><label>السنة<input inputMode="numeric" value={paymentYear} onChange={(event) => setPaymentYear(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="2028" required /></label><button type="submit" className="button button-dark" disabled={paymentBusy}><Plus size={14} /> {paymentBusy ? 'جارٍ الحفظ...' : 'إضافة مرجع'}</button></form></section>
        <div className="invoice-section"><div className="invoice-heading"><div><h2>الفواتير السابقة</h2><p>سجل واضح بكل المدفوعات والتجديدات.</p></div><button type="button" className="button button-outline" disabled={!invoices.length || loading || invoicesMoreLoading} onClick={exportInvoices}><Download size={14} /> تصدير السجل</button></div><div className="invoice-table"><div className="invoice-row invoice-table-head"><span>رقم الفاتورة</span><span>التاريخ</span><span>المبلغ</span><span>الحالة</span><span /></div>{loading ? <div className="invoice-empty" role="status">جارٍ تحميل الفواتير...</div> : invoices.length ? invoices.map((invoice) => <div className="invoice-row" key={invoice.id}><span className="invoice-id"><FileText size={15} /> {invoice.number}</span><span>{new Date(invoice.createdAt).toLocaleDateString('ar-EG')}</span><span dir="ltr">{money(invoice.amountCents)}</span><span className="paid-status"><Check size={12} /> {invoiceStatusLabels[invoice.status] || invoice.status}</span><button type="button" className="download-button" aria-label={`تحميل ${invoice.number}`} onClick={() => downloadInvoice(invoice)}><Download size={14} /></button></div>) : <div className="invoice-empty">لا توجد فواتير بعد. ستظهر هنا بعد تأكيد دفع اشتراك SaaS.</div>}</div>{invoiceMoreError && <p className="form-error" role="alert">{invoiceMoreError}</p>}{invoicesNextOffset !== null && !loadError && <button type="button" className="text-button" onClick={() => void loadMoreInvoices()} disabled={loading || invoicesMoreLoading} aria-busy={invoicesMoreLoading}>{invoicesMoreLoading ? 'جارٍ تحميل فواتير أقدم...' : invoiceMoreError ? 'إعادة المحاولة' : 'تحميل فواتير أقدم'} <ArrowLeft size={14} /></button>}</div>
        <div className="billing-help"><div className="billing-help-icon"><Link2 size={16} /></div><div><b>هل تحتاج إلى مساعدة في اشتراكك؟</b><span>فريق الدعم جاهز لمراجعة الفاتورة أو الإجابة عن أي سؤال.</span></div><Link href="/support" className="text-link">تواصل مع الدعم <ArrowLeft size={14} /></Link></div>
      </section>
    </main>
  )
}
