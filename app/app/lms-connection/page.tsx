'use client'

import Link from 'next/link'
import { ArrowRight, ExternalLink, Link2, Plus, RefreshCw, ShieldCheck } from 'lucide-react'
import { FormEvent, useEffect, useRef, useState } from 'react'

type LmsCheck = { id: string; status: string; statusCode: number | null; durationMs: number | null; safeMessage: string | null; checkedAt: string }
type LmsLink = { id: string; displayName: string; publicUrl: string; adminUrl: string | null; status: string; lastCheckedAt: string | null; lastErrorCode: string | null; createdAt: string; checks?: LmsCheck[] }

const statusLabels: Record<string, string> = { NOT_CHECKED: 'لم يُفحص بعد', REACHABLE: 'يمكن الوصول إليه', UNREACHABLE: 'تعذر الوصول', NEEDS_ATTENTION: 'يحتاج مراجعة', DISABLED: 'معطل' }

export default function LmsConnectionPage() {
  const [links, setLinks] = useState<LmsLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [publicUrl, setPublicUrl] = useState('')
  const [adminUrl, setAdminUrl] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [checkingId, setCheckingId] = useState('')
  const errorRef = useRef<HTMLDivElement>(null)

  async function load(signal?: AbortSignal) {
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/lms-link?limit=50&offset=0', { cache: 'no-store', signal })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'تعذر تحميل روابط المنصة')
      setLinks(body.links || [])
    } catch (loadError) {
      if (!(loadError instanceof DOMException && loadError.name === 'AbortError')) setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل روابط المنصة')
    } finally { if (!signal?.aborted) setLoading(false) }
  }

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => { void load(controller.signal) }, 0)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [])
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  async function addLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(''); setMessage('')
    try {
      const response = await fetch('/api/lms-link', { method: 'POST', cache: 'no-store', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ displayName, publicUrl, adminUrl }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'تعذر حفظ الرابط')
      setLinks((current) => [body.link, ...current]); setDisplayName(''); setPublicUrl(''); setAdminUrl(''); setShowForm(false); setMessage('تم حفظ الرابط المرجعي. لم يتم نسخ أو قراءة محتوى LMS.')
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'تعذر حفظ الرابط') } finally { setSaving(false) }
  }

  async function checkLink(id: string) {
    setCheckingId(id); setError(''); setMessage('')
    try {
      const response = await fetch(`/api/lms-link/${id}/check`, { method: 'POST', cache: 'no-store' })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'تعذر فحص الرابط')
      setLinks((current) => current.map((link) => link.id === id ? { ...link, ...body.link, checks: [body.check, ...(link.checks || [])].slice(0, 5) } : link))
      setMessage('اكتمل فحص الوصول. النتيجة لا تعني قراءة محتوى LMS أو ضمان سلامة وظائفه.')
    } catch (checkError) { setError(checkError instanceof Error ? checkError.message : 'تعذر فحص الرابط') } finally { setCheckingId('') }
  }

  return (
    <main className="billing-page">
      <header className="billing-header section-container"><Link href="/dashboard" className="brand" aria-label="العودة إلى لوحة التحكم"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><Link href="/dashboard" className="button button-outline"><ArrowRight size={14} /> العودة للوحة التحكم</Link></header>
      <section className="billing-content section-container">
        <div className="billing-heading"><div><span className="section-eyebrow"><span className="eyebrow-dot" />رابط المنصة</span><h1>منصتك في مكان واحد، <em>دون نقلها.</em></h1><p>احفظ روابطك العامة وروابط الإدارة كمرجع داخل SaaS. فحص الوصول محدود ولا يعني أن مركزية تراقب صحة LMS أو تقرأ قاعدة بياناته.</p></div><div className="billing-security"><ShieldCheck size={16} /><span>Link-only mode</span></div></div>
        {error && <div ref={errorRef} tabIndex={-1} className="form-error" role="alert"><span>{error}</span><button type="button" className="text-button" onClick={() => void load()} disabled={loading}><RefreshCw size={14} /> إعادة المحاولة</button></div>}
        {message && <div className="billing-help" role="status"><ShieldCheck size={16} /><span>{message}</span></div>}
        <div className="invoice-heading"><div><h2>الروابط المحفوظة</h2><p>نحتفظ بالاسم والرابط والحالة المرجعية فقط.</p></div><button type="button" className="button button-dark" onClick={() => setShowForm((value) => !value)}><Plus size={15} /> {showForm ? 'إغلاق النموذج' : 'إضافة رابط'}</button></div>
        {showForm && <form className="dashboard-link-form" onSubmit={addLink}><label>اسم المنصة<input required minLength={2} maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="أكاديمية النور" /></label><label>الرابط العام HTTPS<input required type="url" value={publicUrl} onChange={(event) => setPublicUrl(event.target.value)} placeholder="https://academy.example.com" /></label><label>رابط الإدارة (اختياري)<input type="url" value={adminUrl} onChange={(event) => setAdminUrl(event.target.value)} placeholder="https://academy.example.com/admin" /></label><button type="submit" className="button button-dark" disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ الرابط'}</button></form>}
        {loading ? <div className="invoice-empty" role="status">جارٍ تحميل الروابط...</div> : links.length ? <div className="invoice-table">{links.map((link) => <article className="invoice-row" key={link.id}><span className="invoice-id"><Link2 size={15} /> {link.displayName}</span><span><a href={link.publicUrl} target="_blank" rel="noreferrer">فتح الرابط <ExternalLink size={13} /></a>{link.adminUrl && <><br /><a href={link.adminUrl} target="_blank" rel="noreferrer">فتح الإدارة <ExternalLink size={13} /></a></>}</span><span>{statusLabels[link.status] || link.status}<small>{link.lastErrorCode ? ` · ${link.lastErrorCode}` : ''}</small></span><span>{link.lastCheckedAt ? `آخر تحقق: ${new Date(link.lastCheckedAt).toLocaleString('ar-EG')}` : 'لم يُتحقق بعد'}<br /><button type="button" className="text-button" onClick={() => void checkLink(link.id)} disabled={checkingId === link.id}>{checkingId === link.id ? 'جارٍ الفحص...' : 'فحص الوصول'}</button>{link.checks?.length ? <small>آخر نتيجة: {link.checks[0].statusCode || 'بدون HTTP'} · {link.checks[0].durationMs || '—'}ms</small> : null}</span></article>)}</div> : <div className="invoice-empty"><Link2 size={20} /> لا يوجد رابط محفوظ بعد. ابدأ برابط HTTPS عام تملكه.</div>}
        <div className="billing-help"><ShieldCheck size={16} /><div><b>حدود واضحة</b><span>حالة REACHABLE تعني نجاح فحص وصول محدود في وقت محدد فقط، ولا تعني صحة المحتوى أو توفر كل وظائف LMS.</span></div></div>
      </section>
    </main>
  )
}
