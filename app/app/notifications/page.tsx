'use client'

import Link from 'next/link'
import { AlertCircle, ArrowLeft, ArrowRight, Bell, Check, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

type Notification = { id: string; type: string; title: string; body: string; readAt: string | null; createdAt: string }

function date(value: string) { return new Date(value).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) }

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [nextOffset, setNextOffset] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [moreLoading, setMoreLoading] = useState(false)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  const load = useCallback(async (offset = 0, append = false) => {
    setError('')
    if (append) setMoreLoading(true)
    else setLoading(true)
    try {
      const response = await fetch(`/api/notifications?limit=25&offset=${offset}`, { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'تعذر تحميل الإشعارات')
      setNotifications((current) => append ? [...current, ...(payload.notifications || [])] : (payload.notifications || []))
      setUnread(payload.unread || 0)
      setNextOffset(typeof payload.pagination?.nextOffset === 'number' ? payload.pagination.nextOffset : null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل الإشعارات')
    } finally {
      if (append) setMoreLoading(false)
      else setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  async function markRead(id?: string) {
    setBusyId(id || 'all')
    try {
      const response = await fetch('/api/notifications', { method: 'PATCH', cache: 'no-store', headers: { 'content-type': 'application/json' }, body: JSON.stringify(id ? { id } : { all: true }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'تعذر تحديث الإشعار')
      setNotifications((current) => id ? current.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item) : current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })))
      setUnread((value) => id ? Math.max(0, value - 1) : 0)
    } catch (updateError) { setError(updateError instanceof Error ? updateError.message : 'تعذر تحديث الإشعار') } finally { setBusyId('') }
  }

  return <main className="billing-page"><header className="billing-header section-container"><Link href="/app/overview" className="brand" aria-label="العودة إلى مساحة العمل"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><Link href="/app/overview" className="button button-outline"><ArrowRight size={14} /> العودة للنظرة العامة</Link></header><section className="billing-content section-container"><div className="billing-heading"><div><span className="section-eyebrow"><span className="eyebrow-dot" />الإشعارات</span><h1>تنبيهات SaaS، <em>دون ضوضاء.</em></h1><p>إشعارات الحساب والفوترة والدعم فقط. لا نعرض تنبيهات تعليمية أو حالة LMS من رابط مرجعي.</p></div><div className="billing-security"><ShieldCheck size={16} /><span>{unread ? `${unread} غير مقروءة` : 'كل الإشعارات مقروءة'}</span></div></div>{error && <div className="form-error" role="alert"><span>{error}</span><button type="button" className="text-button" onClick={() => void load()}><RefreshCw size={14} /> إعادة المحاولة</button></div>}<div className="invoice-heading"><div><h2>مركز الإشعارات</h2><p>راجع الأحداث المسجلة داخل حسابك.</p><span className="sr-only">لا توجد إشعارات جديدة عند عدم وجود أحداث جديدة.</span></div><button type="button" className="button button-outline" disabled={!unread || !!busyId} onClick={() => void markRead()}>{busyId === 'all' ? 'جارٍ التحديث...' : 'تعليم الكل كمقروء'} <Check size={14} /></button></div><div className="invoice-table">{loading ? <div className="invoice-empty" role="status">جارٍ تحميل الإشعارات...</div> : notifications.length ? notifications.map((notification) => <article className={`notification-row ${notification.readAt ? 'is-read' : 'is-unread'}`} key={notification.id}><div className="notification-icon"><Bell size={16} /></div><div className="notification-copy"><b>{notification.title}</b><p>{notification.body}</p><small>{date(notification.createdAt)} · {notification.type}</small></div>{notification.readAt ? <span className="notification-read"><CheckCircle2 size={14} /> مقروء</span> : <button type="button" className="text-button" disabled={busyId === notification.id} onClick={() => void markRead(notification.id)}>{busyId === notification.id ? '...' : 'تعليم كمقروء'} <Check size={14} /></button>}</article>) : <div className="invoice-empty"><Bell size={20} /> لا توجد إشعارات جديدة.</div>}</div>{nextOffset !== null && <button type="button" className="text-button" disabled={moreLoading} onClick={() => void load(nextOffset, true)}>{moreLoading ? 'جارٍ التحميل...' : 'تحميل إشعارات أقدم'} <ArrowLeft size={14} /></button>}<div className="dashboard-metrics usage-metrics"><article className="dash-card"><div className="dash-card-head"><span>الفوترة</span><CheckCircle2 size={16} /></div><strong>أحداث الحساب</strong><small>راجع الاشتراك والفواتير لمعرفة الأحداث المالية المسجلة.</small></article><article className="dash-card"><div className="dash-card-head"><span>الدعم</span><AlertCircle size={16} /></div><strong>تذكرة دعم</strong><small>تابع الردود داخل تذكرة الدعم الخاصة بمساحة العمل.</small></article><article className="dash-card"><div className="dash-card-head"><span>LMS</span><ShieldCheck size={16} /></div><strong>نطاق منفصل</strong><small>لا تُصدر مركزية تنبيهات صحة LMS أو محتواه من رابط مرجعي فقط.</small></article></div></section></main>
}
