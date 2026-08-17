'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, CircleHelp, Clock3, FileText, LifeBuoy, MessageSquare, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

const tickets = [
  { id: '#SUP-1024', subject: 'سؤال حول رابط المنصة', date: '12 يونيو 2025', status: 'مغلقة' },
  { id: '#SUP-0988', subject: 'تحديث بيانات الفاتورة', date: '28 مايو 2025', status: 'مغلقة' },
]

export default function SupportPage() {
  const [submitted, setSubmitted] = useState(false)
  return (
    <main className="support-page">
      <header className="support-header section-container"><Link href="/dashboard" className="brand"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><Link href="/dashboard" className="button button-outline"><ArrowRight size={14} /> العودة للوحة التحكم</Link></header>
      <section className="support-content section-container">
        <div className="support-heading"><div><span className="section-eyebrow"><span className="eyebrow-dot" />مركز المساعدة</span><h1>دعم واضح، <em>عندما تحتاجه.</em></h1><p>أرسل سؤالك أو راجع تذاكرك السابقة. فريق مركزية يتابع معك دون تعقيد أو وعود غامضة.</p></div><div className="support-heading-icon"><LifeBuoy size={29} /></div></div>
        <div className="support-layout"><section className="new-ticket-card"><div className="support-card-heading"><div><b>افتح تذكرة جديدة</b><span>سنراجع طلبك ونرد عليك عبر البريد الإلكتروني.</span></div><MessageSquare size={17} /></div>{submitted ? <div className="ticket-success"><div><Check size={20} /></div><b>وصل طلبك إلى الفريق</b><span>رقم التذكرة #SUP-1027. سنعود إليك خلال يوم عمل واحد.</span><button className="button button-outline" onClick={() => setSubmitted(false)}>إرسال طلب آخر</button></div> : <form className="support-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true) }}><label>موضوع الطلب<input required placeholder="مثل: أحتاج مساعدة في الفاتورة" /></label><label>التفاصيل<textarea required rows={5} placeholder="اكتب ما تحتاجه بالتفصيل..." /></label><div className="support-form-foot"><span><ShieldCheck size={13} /> لا نطلب بيانات حساسة هنا</span><button className="button button-dark" type="submit">إرسال التذكرة <ArrowLeft size={14} /></button></div></form>}</section><aside className="support-side"><div className="support-contact-card"><div className="support-contact-icon"><Clock3 size={17} /></div><b>متوسط الرد: أقل من يوم عمل</b><span>تذاكر الدعم متاحة لكل الخطط، وتختلف الأولوية حسب باقتك.</span><Link href="#faq" className="text-link">الأسئلة الشائعة <ArrowLeft size={13} /></Link></div><div className="support-faq-mini"><div className="support-card-heading"><b>أسئلة سريعة</b><CircleHelp size={16} /></div><Link href="/#faq">هل تنشئون LMS جديدًا؟ <ArrowLeft size={13} /></Link><Link href="/#faq">ماذا يحدث بعد الدفع؟ <ArrowLeft size={13} /></Link><Link href="/#faq">كيف أضيف رابط المنصة؟ <ArrowLeft size={13} /></Link></div></aside></div>
        <div className="tickets-section"><div className="tickets-heading"><div><h2>تذاكرك السابقة</h2><p>كل محادثاتك محفوظة في مكان واحد.</p></div><button className="button button-outline"><FileText size={14} /> تصفية التذاكر</button></div><div className="tickets-table"><div className="ticket-row ticket-table-head"><span>رقم التذكرة</span><span>الموضوع</span><span>آخر تحديث</span><span>الحالة</span><span /></div>{tickets.map((ticket) => <div className="ticket-row" key={ticket.id}><span className="ticket-id"><span className="ticket-id-icon"><MessageSquare size={13} /></span>{ticket.id}</span><span>{ticket.subject}</span><span>{ticket.date}</span><span className="ticket-status"><Check size={12} /> {ticket.status}</span><button aria-label={`فتح ${ticket.id}`}><ArrowLeft size={14} /></button></div>)}</div></div>
      </section>
    </main>
  )
}
