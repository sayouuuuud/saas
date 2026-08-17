'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, ChevronDown, CreditCard, Download, FileText, Link2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

const invoices = [
  { id: '#MK-0048', date: '17 يونيو 2025', amount: '$31.00', status: 'مدفوعة' },
  { id: '#MK-0037', date: '17 مايو 2025', amount: '$31.00', status: 'مدفوعة' },
  { id: '#MK-0026', date: '17 أبريل 2025', amount: '$31.00', status: 'مدفوعة' },
]

export default function BillingPage() {
  const [annual, setAnnual] = useState(false)
  const [showPlans, setShowPlans] = useState(false)
  return (
    <main className="billing-page">
      <header className="billing-header section-container"><Link href="/dashboard" className="brand"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><Link href="/dashboard" className="button button-outline"><ArrowRight size={14} /> العودة للوحة التحكم</Link></header>
      <section className="billing-content section-container">
        <div className="billing-heading"><div><span className="section-eyebrow"><span className="eyebrow-dot" />الاشتراك والفوترة</span><h1>اشتراكك، <em>بكل وضوح.</em></h1><p>تابع باقتك الحالية، موعد التجديد، وطريقة الدفع والفواتير السابقة من مساحة واحدة.</p></div><div className="billing-security"><ShieldCheck size={16} /><span>دفع آمن وبيانات واضحة</span></div></div>
        <div className="billing-current-grid"><article className="current-plan-card"><div className="current-card-top"><span className="plan-name">Growth</span><span className="current-pill"><i /> نشطة</span></div><p>للمدرسين الذين يريدون مساحة عمل أكثر تنظيمًا.</p><div className="current-price"><strong>$31</strong><span>/ شهر</span></div><small>التجديد القادم في 17 يوليو 2025</small><div className="plan-progress"><div><span>استخدام مساحة العمل</span><b>3 / 5 أعضاء</b></div><div className="progress-track"><i /></div></div><button className="button button-light" onClick={() => setShowPlans(!showPlans)}>{showPlans ? 'إخفاء الخطط' : 'تغيير الباقة'} <ChevronDown size={14} /></button></article><article className="payment-card"><div className="billing-card-title"><span>طريقة الدفع</span><CreditCard size={17} /></div><div className="payment-method"><div className="mastercard"><i /><i /></div><div><b>•••• 4242</b><small>تنتهي في 08/27</small></div><button className="text-button">تعديل</button></div><div className="payment-note"><Check size={13} /> آخر دفعة مؤكدة في 17 يونيو 2025</div></article></div>
        {showPlans && <div className="billing-plan-switcher"><div><b>اختر ما يناسب مرحلتك القادمة</b><span>يمكنك تغيير الباقة في أي وقت.</span></div><div className="billing-plan-actions"><button className={annual ? '' : 'selected'} onClick={() => setAnnual(false)}>شهري</button><button className={annual ? 'selected' : ''} onClick={() => setAnnual(true)}>سنوي <em>وفر 20%</em></button></div><div className="mini-plans"><div><b>Starter</b><strong>${annual ? '12' : '15'}</strong><button>اختيار</button></div><div className="mini-plan-featured"><b>Growth</b><strong>${annual ? '25' : '31'}</strong><button>الباقة الحالية</button></div><div><b>Academy</b><strong>${annual ? '50' : '63'}</strong><button>اختيار</button></div></div></div>}
        <div className="invoice-section"><div className="invoice-heading"><div><h2>الفواتير السابقة</h2><p>سجل واضح بكل المدفوعات والتجديدات.</p></div><button className="button button-outline"><Download size={14} /> تصدير السجل</button></div><div className="invoice-table"><div className="invoice-row invoice-table-head"><span>رقم الفاتورة</span><span>التاريخ</span><span>المبلغ</span><span>الحالة</span><span /></div>{invoices.map((invoice) => <div className="invoice-row" key={invoice.id}><span className="invoice-id"><FileText size={15} /> {invoice.id}</span><span>{invoice.date}</span><span dir="ltr">{invoice.amount}</span><span className="paid-status"><Check size={12} /> {invoice.status}</span><button className="download-button" aria-label={`تحميل ${invoice.id}`}><Download size={14} /></button></div>)}</div></div>
        <div className="billing-help"><div className="billing-help-icon"><Link2 size={16} /></div><div><b>هل تحتاج إلى مساعدة في اشتراكك؟</b><span>فريق الدعم جاهز لمراجعة الفاتورة أو الإجابة عن أي سؤال.</span></div><Link href="/support" className="text-link">تواصل مع الدعم <ArrowLeft size={14} /></Link></div>
      </section>
    </main>
  )
}
