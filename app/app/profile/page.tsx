'use client'

import Link from 'next/link'
import { ArrowRight, Check, Mail, Save, ShieldCheck, UserRound } from 'lucide-react'
import { FormEvent, useEffect, useRef, useState } from 'react'

type Profile = { id: string; name: string; email: string; emailVerifiedAt: string | null; createdAt: string }

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      fetch('/api/me', { cache: 'no-store', signal: controller.signal })
        .then(async (response) => {
          const payload = await response.json().catch(() => ({}))
          if (!response.ok) throw new Error(payload.error || 'تعذر تحميل الملف الشخصي')
          setProfile(payload.user); setName(payload.user.name); setEmail(payload.user.email)
        })
        .catch((loadError) => { if (!(loadError instanceof DOMException && loadError.name === 'AbortError')) setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل الملف الشخصي') })
        .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    }, 0)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [])

  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(''); setMessage('')
    try {
      const response = await fetch('/api/me', { method: 'PATCH', cache: 'no-store', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, email }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'تعذر حفظ الملف الشخصي')
      setProfile(payload.user); setName(payload.user.name); setEmail(payload.user.email); setMessage('تم حفظ بيانات الملف الشخصي. قد تحتاج إلى إعادة التحقق من البريد إذا تغيّر.')
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'تعذر حفظ الملف الشخصي') } finally { setSaving(false) }
  }

  return (
    <main className="billing-page">
      <header className="billing-header section-container"><Link href="/dashboard" className="brand" aria-label="العودة إلى لوحة التحكم"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><Link href="/dashboard" className="button button-outline"><ArrowRight size={14} /> العودة للوحة التحكم</Link></header>
      <section className="billing-content section-container">
        <div className="billing-heading"><div><span className="section-eyebrow"><span className="eyebrow-dot" />الحساب</span><h1>ملفك الشخصي، <em>تحت سيطرتك.</em></h1><p>عدّل بيانات حساب SaaS الأساسية. لا نطلب بيانات LMS ولا نخلط ملفك الشخصي مع محتوى المنصة التعليمية.</p></div><div className="billing-security"><ShieldCheck size={16} /><span>بيانات خاصة وغير قابلة للتخزين المؤقت</span></div></div>
        {error && <div ref={errorRef} tabIndex={-1} className="form-error" role="alert">{error}</div>}
        {message && <div className="billing-help" role="status"><Check size={17} /><span>{message}</span></div>}
        {loading ? <div className="invoice-empty" role="status">جارٍ تحميل الملف الشخصي...</div> : <form className="dashboard-link-form" onSubmit={save} aria-label="تعديل الملف الشخصي"><label><span><UserRound size={15} /> الاسم</span><input required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label><label><span><Mail size={15} /> البريد الإلكتروني</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label><div><button type="submit" className="button button-dark" disabled={saving}>{saving ? 'جارٍ الحفظ...' : <><Save size={15} /> حفظ التغييرات</>}</button></div><p className="dashboard-footer-note"><ShieldCheck size={15} />{profile?.emailVerifiedAt ? ` البريد موثق منذ ${new Date(profile.emailVerifiedAt).toLocaleDateString('ar-EG')}` : ' البريد يحتاج إلى التحقق عند تغييره'}</p></form>}
      </section>
    </main>
  )
}
