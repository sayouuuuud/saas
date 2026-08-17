'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, CircleHelp, Clock3, LifeBuoy, MessageSquare, RefreshCw, ShieldCheck } from 'lucide-react'
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'

type Ticket = { id: string; number: string; subject: string; status: string; createdAt: string; updatedAt: string }

const ticketStatusLabels: Record<string, string> = {
  OPEN: 'مفتوحة',
  IN_PROGRESS: 'قيد المتابعة',
  WAITING_ON_CUSTOMER: 'بانتظار ردك',
  RESOLVED: 'تم الحل',
  CLOSED: 'مغلقة',
}

export default function SupportPage() {
  const [submitted, setSubmitted] = useState<Ticket | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('GENERAL')
  const [error, setError] = useState('')
  const [ticketsError, setTicketsError] = useState('')
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [ticketsMoreLoading, setTicketsMoreLoading] = useState(false)
  const [ticketsNextOffset, setTicketsNextOffset] = useState<number | null>(null)
  const [ticketFilter, setTicketFilter] = useState('ALL')
  const [loading, setLoading] = useState(false)

  const ticketsControllerRef = useRef<AbortController | null>(null)
  const loadTickets = useCallback(async (offset = 0, append = false) => {
    ticketsControllerRef.current?.abort()
    const controller = new AbortController()
    ticketsControllerRef.current = controller
    if (append) {
      setTicketsMoreLoading(true)
      setTicketsLoading(false)
    } else {
      setTicketsLoading(true)
      setTicketsMoreLoading(false)
    }
    setTicketsError('')
    try {
      const response = await fetch(`/api/tickets?limit=25&offset=${offset}`, { cache: 'no-store', signal: controller.signal })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'تعذر تحميل التذاكر السابقة')
      if (controller.signal.aborted) return
      setTickets((current) => append ? [...current, ...(payload.tickets || [])] : (payload.tickets || []))
      setTicketsNextOffset(typeof payload.pagination?.nextOffset === 'number' ? payload.pagination.nextOffset : null)
    } catch (loadError) {
      if (!controller.signal.aborted) setTicketsError(loadError instanceof Error ? loadError.message : 'تعذر تحميل التذاكر السابقة')
    } finally {
      if (!controller.signal.aborted && ticketsControllerRef.current === controller) {
        if (append) setTicketsMoreLoading(false)
        else setTicketsLoading(false)
        ticketsControllerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadTickets() }, 0)
    return () => {
      window.clearTimeout(timer)
      ticketsControllerRef.current?.abort()
    }
  }, [loadTickets])

  const visibleTickets = ticketFilter === 'ALL' ? tickets : tickets.filter((ticket) => ticket.status === ticketFilter)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('')
    try {
      const response = await fetch('/api/tickets', { method: 'POST', cache: 'no-store', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subject, description, category }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'تعذر إرسال التذكرة')
      setSubmitted(payload.ticket); setTickets((current) => [payload.ticket, ...current]); setSubject(''); setDescription('')
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'تعذر إرسال التذكرة') } finally { setLoading(false) }
  }

  return (
    <main className="support-page">
      <header className="support-header section-container"><Link href="/dashboard" className="brand"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><Link href="/dashboard" className="button button-outline"><ArrowRight size={14} /> العودة للوحة التحكم</Link></header>
      <section className="support-content section-container">
        <div className="support-heading"><div><span className="section-eyebrow"><span className="eyebrow-dot" />مركز المساعدة</span><h1>دعم واضح، <em>عندما تحتاجه.</em></h1><p>أرسل سؤالك أو راجع تذاكرك السابقة. فريق مركزية يتابع معك دون تعقيد أو وعود غامضة.</p></div><div className="support-heading-icon"><LifeBuoy size={29} /></div></div>
        <div className="support-layout"><section className="new-ticket-card"><div className="support-card-heading"><div><b>افتح تذكرة جديدة</b><span>سنراجع طلبك ونرد عليك عبر البريد الإلكتروني.</span></div><MessageSquare size={17} /></div>{submitted ? <div className="ticket-success" role="status"><div><Check size={20} /></div><b>وصل طلبك إلى الفريق</b><span>رقم التذكرة {submitted.number}. الحالة الحالية: مفتوحة.</span><button type="button" className="button button-outline" onClick={() => setSubmitted(null)}>إرسال طلب آخر</button></div> : <form className="support-form" onSubmit={submit}><label>نوع الطلب<select name="category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="GENERAL">عام</option><option value="BILLING">الفوترة</option><option value="SUBSCRIPTION">الاشتراك</option><option value="LMS_LINK">رابط المنصة</option><option value="SECURITY">الأمان</option></select></label><label>موضوع الطلب<input name="subject" required value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="مثل: أحتاج مساعدة في الفاتورة" /></label><label>التفاصيل<textarea name="description" required minLength={10} value={description} onChange={(event) => setDescription(event.target.value)} rows={5} placeholder="اكتب ما تحتاجه بالتفصيل..." /></label><div className="support-form-foot"><span><ShieldCheck size={13} /> لا نطلب بيانات حساسة هنا</span><button disabled={loading} className="button button-dark" type="submit">{loading ? 'جارٍ الإرسال...' : 'إرسال التذكرة'} <ArrowLeft size={14} /></button></div>{error && <p className="form-error" role="alert">{error}</p>}</form>}</section><aside className="support-side"><div className="support-contact-card"><div className="support-contact-icon"><Clock3 size={17} /></div><b>متوسط الرد: أقل من يوم عمل</b><span>تذاكر الدعم متاحة لكل الخطط، وتختلف الأولوية حسب باقتك.</span><Link href="#faq" className="text-link">الأسئلة الشائعة <ArrowLeft size={13} /></Link></div><div className="support-faq-mini"><div className="support-card-heading"><b>أسئلة سريعة</b><CircleHelp size={16} /></div><Link href="/#faq">هل تنشئون LMS جديدًا؟ <ArrowLeft size={13} /></Link><Link href="/#faq">ماذا يحدث بعد الدفع؟ <ArrowLeft size={13} /></Link><Link href="/#faq">كيف أضيف رابط المنصة؟ <ArrowLeft size={13} /></Link></div></aside></div>
        <div className="tickets-section"><div className="tickets-heading"><div><h2>تذاكرك السابقة</h2><p>كل محادثاتك محفوظة في مكان واحد.</p></div><label className="sr-only" htmlFor="ticket-filter">تصفية التذاكر</label><select id="ticket-filter" className="button button-outline" aria-label="تصفية التذاكر" value={ticketFilter} onChange={(event) => setTicketFilter(event.target.value)}><option value="ALL">كل التذاكر</option><option value="OPEN">مفتوحة</option><option value="IN_PROGRESS">قيد المتابعة</option><option value="WAITING_ON_CUSTOMER">بانتظار ردك</option><option value="CLOSED">مغلقة</option></select></div><div className="tickets-table"><div className="ticket-row ticket-table-head"><span>رقم التذكرة</span><span>الموضوع</span><span>آخر تحديث</span><span>الحالة</span><span /></div>{ticketsError ? <div className="invoice-empty" role="alert"><span>{ticketsError}</span><button type="button" className="text-button" onClick={() => void loadTickets()} disabled={ticketsLoading || ticketsMoreLoading}><RefreshCw size={14} /> إعادة المحاولة</button></div> : ticketsLoading ? <div className="invoice-empty" role="status">جارٍ تحميل التذاكر...</div> : visibleTickets.length ? visibleTickets.map((ticket) => <div className="ticket-row" key={ticket.id}><span className="ticket-id"><span className="ticket-id-icon"><MessageSquare size={13} /></span>{ticket.number}</span><span>{ticket.subject}</span><span>{new Date(ticket.updatedAt).toLocaleDateString('ar-EG')}</span><span className="ticket-status"><Check size={12} /> {ticketStatusLabels[ticket.status] || ticket.status}</span><Link href={`/support/${ticket.id}`} className="download-button" aria-label={`فتح ${ticket.number}`}><ArrowLeft size={14} /></Link></div>) : <div className="invoice-empty">{ticketFilter === 'ALL' ? 'لا توجد تذاكر بعد.' : 'لا توجد تذاكر بهذه الحالة.'}</div>}</div>{ticketsNextOffset !== null && !ticketsError && <button type="button" className="text-button" onClick={() => void loadTickets(ticketsNextOffset, true)} disabled={ticketsLoading || ticketsMoreLoading} aria-busy={ticketsMoreLoading}>{ticketsMoreLoading ? 'جارٍ تحميل المزيد...' : 'تحميل تذاكر أقدم'} <ArrowLeft size={14} /></button>}</div>
      </section>
    </main>
  )
}
