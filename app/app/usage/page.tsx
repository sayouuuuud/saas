'use client'

import Link from 'next/link'
import { Activity, ArrowRight, Check, Clock3, Info, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Metric = { value: number | null; source: string | null; accuracy: string }
type UsagePayload = { measuredAt: string; metrics: Record<string, Metric> }

const labels: Record<string, string> = {
  teamMembers: 'أعضاء الفريق',
  supportTickets: 'تذاكر الدعم',
  linkChecks: 'فحوصات روابط المنصة',
  auditEvents: 'أحداث التدقيق',
  integrationApiCalls: 'استدعاءات التكامل',
  students: 'المتعلمون',
  videos: 'الفيديوهات',
  storage: 'التخزين',
  bandwidth: 'عرض النطاق',
  cpuRam: 'CPU وRAM',
}

function freshness(value: string) {
  return new Date(value).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function UsagePage() {
  const [payload, setPayload] = useState<UsagePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const errorRef = useRef<HTMLDivElement>(null)

  async function load(signal?: AbortSignal) {
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/usage', { cache: 'no-store', signal })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'تعذر تحميل الاستخدام')
      setPayload(body)
    } catch (loadError) {
      if (!(loadError instanceof DOMException && loadError.name === 'AbortError')) setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل الاستخدام')
    } finally { if (!signal?.aborted) setLoading(false) }
  }

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => { void load(controller.signal) }, 0)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [])
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  return (
    <main className="billing-page">
      <header className="billing-header section-container"><Link href="/dashboard" className="brand" aria-label="العودة إلى لوحة التحكم"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><Link href="/dashboard" className="button button-outline"><ArrowRight size={14} /> العودة للوحة التحكم</Link></header>
      <section className="billing-content section-container">
        <div className="billing-heading"><div><span className="section-eyebrow"><span className="eyebrow-dot" />الاستخدام والتقارير</span><h1>أرقام واضحة، <em>بمصدرها.</em></h1><p>نعرض ما تقيسه مركزية داخل SaaS فقط. لا نعرض أرقام المتعلمين أو الفيديوهات أو التخزين دون مصدر رسمي ومصرّح به من LMS.</p></div><div className="billing-security"><ShieldCheck size={16} /><span>المصدر والدرجة ظاهرون دائمًا</span></div></div>
        {error && <div ref={errorRef} tabIndex={-1} className="form-error" role="alert"><span>{error}</span><button type="button" className="text-button" onClick={() => void load()} disabled={loading}><RefreshCw size={14} /> إعادة المحاولة</button></div>}
        {loading ? <div className="invoice-empty" role="status">جارٍ قياس بيانات SaaS...</div> : payload ? <>
          <div className="dashboard-footer-note"><Clock3 size={15} /> آخر قياس: {freshness(payload.measuredAt)} · كل الأرقام التالية exact من قاعدة SaaS</div>
          <div className="dashboard-metrics usage-metrics">{Object.entries(payload.metrics).map(([key, metric]) => <article className="dash-card" key={key}><div className="dash-card-head"><span>{labels[key] || key}</span><Activity size={16} /></div><strong>{metric.value === null ? 'غير متاح' : metric.value.toLocaleString('ar-EG')}</strong><small>{metric.value === null ? 'لا يوجد مصدر LMS رسمي موصول' : `المصدر: ${metric.source} · ${metric.accuracy}`}</small>{metric.value === null ? <span className="form-error" role="note"><Info size={13} /> غير متحقق</span> : <span className="connected-badge"><Check size={12} /> exact</span>}</article>)}</div>
          <div className="billing-help"><ShieldCheck size={16} /><div><b>حدود القياس</b><span>أرقام مركزية تقيس نشاط SaaS مثل الفريق والدعم وفحوصات الروابط. حالة الرابط لا تعني صحة LMS، والمقاييس غير المدعومة تبقى غير متاحة بدل التخمين.</span></div></div>
        </> : null}
      </section>
    </main>
  )
}
