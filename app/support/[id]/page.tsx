'use client'

import Link from 'next/link'
import { ArrowRight, Check, LifeBuoy, LockKeyhole, MessageSquare, RefreshCw, Send, ShieldCheck } from 'lucide-react'
import { FormEvent, useCallback, useEffect, useState } from 'react'

const statusLabels: Record<string, string> = {
  OPEN: 'مفتوحة',
  IN_PROGRESS: 'قيد المتابعة',
  WAITING_ON_CUSTOMER: 'بانتظار ردك',
  RESOLVED: 'تم الحل',
  CLOSED: 'مغلقة',
}

const categoryLabels: Record<string, string> = {
  GENERAL: 'عام',
  BILLING: 'الفوترة',
  SUBSCRIPTION: 'الاشتراك',
  ACCOUNT: 'الحساب',
  LMS_LINK: 'رابط المنصة',
  INTEGRATION: 'التكامل',
  USAGE: 'الاستخدام',
  SECURITY: 'الأمان',
  FEATURE_REQUEST: 'اقتراح ميزة',
}

type Message = { id: string; body: string; createdAt: string; author?: { name?: string | null; email?: string | null } | null }
type Ticket = { id: string; number: string; subject: string; description: string; category: string; status: string; priority: string; createdAt: string; updatedAt: string; messages: Message[] }

function date(value: string) { return new Date(value).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) }

export default function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [ticketId, setTicketId] = useState('')
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async (id: string, signal?: AbortSignal) => {
    setLoading(true); setError('')
    try {
      const response = await fetch(`/api/tickets/${id}`, { cache: 'no-store', signal })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'تعذر تحميل التذكرة')
      setTicket(payload.ticket)
    } catch (loadError) {
      if (!(loadError instanceof DOMException && loadError.name === 'AbortError')) setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل التذكرة')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    void params.then(({ id }) => { if (active) { setTicketId(id); void load(id, controller.signal) } })
    return () => { active = false; controller.abort() }
  }, [load, params])

  async function mutate(path: string, options: RequestInit, success: string) {
    setBusy(true); setError(''); setNotice('')
    try {
      const response = await fetch(path, { ...options, cache: 'no-store', headers: { 'content-type': 'application/json', ...(options.headers || {}) } })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'تعذر تحديث التذكرة')
      setTicket(payload.ticket || ticket)
      setBody('')
      setNotice(success)
      if (ticketId) await load(ticketId)
    } catch (mutationError) { setError(mutationError instanceof Error ? mutationError.message : 'تعذر تحديث التذكرة') } finally { setBusy(false) }
  }

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!body.trim() || !ticketId) return
    await mutate(`/api/tickets/${ticketId}/messages`, { method: 'POST', body: JSON.stringify({ body: body.trim() }) }, 'تم إرسال ردك، وأعيد فتح التذكرة للمتابعة.')
  }

  if (loading) return <main className="support-page"><section className="support-content section-container"><div className="invoice-empty" role="status">جارٍ تحميل التذكرة...</div></section></main>
  if (error && !ticket) return <main className="support-page"><header className="support-header section-container"><Link href="/support" className="brand">مركزية</Link></header><section className="support-content section-container"><div className="form-error" role="alert">{error}</div><Link href="/support" className="button button-dark">العودة للدعم <ArrowRight size={14} /></Link></section></main>
  if (!ticket) return null

  const closed = ticket.status === 'CLOSED'
  return <main className="support-page">
    <header className="support-header section-container"><Link href="/support" className="brand"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><Link href="/support" className="button button-outline"><ArrowRight size={14} /> العودة للتذاكر</Link></header>
    <section className="support-content section-container">
      <div className="support-heading"><div><span className="section-eyebrow"><span className="eyebrow-dot" />تفاصيل التذكرة</span><h1>{ticket.subject}</h1><p>{ticket.number} · {categoryLabels[ticket.category] || ticket.category} · آخر تحديث {date(ticket.updatedAt)}</p></div><div className="support-heading-icon"><LifeBuoy size={29} /></div></div>
      <div className="workspace-card-grid">
        <article className="workspace-panel workspace-panel-accent"><div className="workspace-panel-heading"><div><b>الحالة الحالية</b><span>{statusLabels[ticket.status] || ticket.status} · أولوية {ticket.priority}</span></div><Check size={17} /></div><p>{ticket.description}</p><p className="safe-note"><ShieldCheck size={15} /> لا ترسل كلمات مرور أو بيانات بطاقة أو أسرار تكامل داخل الرسائل.</p><div className="workspace-next"><button type="button" className="button button-outline" disabled={busy} onClick={() => void mutate(`/api/tickets/${ticket.id}`, { method: 'POST', body: JSON.stringify({ action: closed ? 'reopen' : 'close' }) }, closed ? 'تمت إعادة فتح التذكرة.' : 'تم إغلاق التذكرة.')}>{busy ? 'جارٍ التحديث...' : closed ? 'إعادة فتح التذكرة' : 'إغلاق التذكرة'}</button></div></article>
        <article className="workspace-panel"><div className="workspace-panel-heading"><b>المحادثة</b><MessageSquare size={16} /></div><div className="workspace-list">{ticket.messages.length ? ticket.messages.map((message) => <div className="workspace-list-row" key={message.id}><span><b>{message.author?.name || message.author?.email || 'فريق مركزية'}</b><small>{date(message.createdAt)}</small></span><span>{message.body}</span></div>) : <p className="invoice-empty">لا توجد رسائل إضافية بعد.</p>}</div></article>
      </div>
      <section className="new-ticket-card"><div className="support-card-heading"><div><b>أضف ردًا</b><span>سيصل ردك إلى فريق الدعم، وتعود التذكرة إلى حالة المتابعة.</span></div><Send size={17} /></div><form className="support-form" onSubmit={submitMessage}><label htmlFor="ticket-message">رسالتك<textarea id="ticket-message" required minLength={2} maxLength={5000} rows={5} value={body} onChange={(event) => setBody(event.target.value)} placeholder="اكتب ردك أو أضف معلومات مفيدة..." /></label><div className="support-form-foot"><span><LockKeyhole size={13} /> محادثة مرتبطة بحسابك</span><button type="submit" disabled={busy || !body.trim()} className="button button-dark">إرسال الرد <Send size={14} /></button></div>{notice && <p className="form-success" role="status">{notice}</p>}{error && <p className="form-error" role="alert">{error}</p>}</form></section>
      <button type="button" className="text-button" onClick={() => ticketId && void load(ticketId)} disabled={loading || busy}><RefreshCw size={14} /> تحديث المحادثة</button>
    </section>
  </main>
}
