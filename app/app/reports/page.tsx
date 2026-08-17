'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, Clock3, Download, FileText, Info, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Invoice = { number: string; status: string; amountCents: number; currency: string; createdAt: string }
type ReportsPayload = { generatedAt: string; summary: { subscriptionStatus: string | null; plan: string | null; invoiceCount: number; ticketCount: number; lmsLinkCount: number; auditEventCount: number }; invoices: Invoice[]; educationalMetrics: { status: string; reason: string } }

function date(value: string) { return new Date(value).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) }

export default function ReportsPage() {
  const [payload, setPayload] = useState<ReportsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const errorRef = useRef<HTMLDivElement>(null)

  async function load(signal?: AbortSignal) {
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/reports', { cache: 'no-store', signal })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'تعذر تحميل التقرير')
      setPayload(body)
    } catch (loadError) {
      if (!(loadError instanceof DOMException && loadError.name === 'AbortError')) setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل التقرير')
    } finally { if (!signal?.aborted) setLoading(false) }
  }

  useEffect(() => { const controller = new AbortController(); const timer = window.setTimeout(() => { void load(controller.signal) }, 0); return () => { window.clearTimeout(timer); controller.abort() } }, [])

  async function exportWorkspace() {
    try {
      const response = await fetch('/api/export', { cache: 'no-store' })
      if (!response.ok) throw new Error('تعذر إنشاء ملف التصدير')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'centralia-workspace-export.json'
      link.click()
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'تعذر إنشاء ملف التصدير')
    }
  }
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  return <main className="billing-page"><header className="billing-header section-container"><Link href="/dashboard" className="brand" aria-label="العودة إلى لوحة التحكم"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><Link href="/dashboard" className="button button-outline"><ArrowRight size={14} /> العودة للوحة التحكم</Link></header><section className="billing-content section-container"><div className="billing-heading"><div><span className="section-eyebrow"><span className="eyebrow-dot" />التقارير</span><h1>تقريرك في SaaS، <em>بلا تخمين.</em></h1><p>يجمع هذا التقرير الاشتراك والفواتير والدعم والروابط وأحداث التدقيق التي تملكها مركزية. بيانات LMS التعليمية غير متاحة دون تكامل رسمي.</p></div><div className="billing-security"><ShieldCheck size={16} /><span>SaaS-only report</span></div></div>{error && <div ref={errorRef} tabIndex={-1} className="form-error" role="alert"><span>{error}</span><button type="button" className="text-button" onClick={() => void load()} disabled={loading}><RefreshCw size={14} /> إعادة المحاولة</button></div>}{loading ? <div className="invoice-empty" role="status">جارٍ إعداد التقرير...</div> : payload ? <><div className="dashboard-footer-note"><Clock3 size={15} /> آخر توليد: {date(payload.generatedAt)} · البيانات exact من SaaS</div><div className="dashboard-metrics usage-metrics"><article className="dash-card"><div className="dash-card-head"><span>الخطة</span><BarChart3 size={16} /></div><strong>{payload.summary.plan || 'غير مشترك'}</strong><small>الحالة: {payload.summary.subscriptionStatus || 'غير متاحة'}</small></article><article className="dash-card"><div className="dash-card-head"><span>الفواتير</span><FileText size={16} /></div><strong>{payload.summary.invoiceCount.toLocaleString('ar-EG')}</strong><small>إجمالي فواتير مساحة العمل</small></article><article className="dash-card"><div className="dash-card-head"><span>تذاكر الدعم</span><BarChart3 size={16} /></div><strong>{payload.summary.ticketCount.toLocaleString('ar-EG')}</strong><small>تذاكر مرتبطة بمساحتك</small></article><article className="dash-card"><div className="dash-card-head"><span>روابط المنصة</span><BarChart3 size={16} /></div><strong>{payload.summary.lmsLinkCount.toLocaleString('ar-EG')}</strong><small>مراجع روابط فقط، وليست صحة LMS</small></article></div><section className="invoice-section"><div className="invoice-heading"><div><h2>آخر الفواتير</h2><p>حتى 12 فاتورة حديثة من SaaS.</p></div><button type="button" className="button button-outline" onClick={() => void exportWorkspace()}><Download size={14} /> تصدير بيانات مساحة العمل</button></div>{payload.invoices.length ? <div className="invoice-table">{payload.invoices.map((invoice) => <div className="invoice-row" key={invoice.number}><span>{invoice.number}</span><span>{(invoice.amountCents / 100).toFixed(2)} {invoice.currency}</span><span>{invoice.status}</span><span>{date(invoice.createdAt)}</span></div>)}</div> : <div className="invoice-empty">لا توجد فواتير بعد.</div>}</section><div className="billing-help"><Info size={16} /><div><b>مقاييس التعليم غير متاحة</b><span>{payload.educationalMetrics.reason}. لا نستنتج الطلاب أو الدروس أو التخزين من رابط خارجي.</span></div></div></> : null}</section></main>
}
