'use client'

import Link from 'next/link'
import { ArrowLeft, CheckCircle2, LockKeyhole, Mail, Users } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function InvitePage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/accept-invite', { method: 'POST', cache: 'no-store', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: params.token, name, password }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'تعذر قبول الدعوة')
      setSuccess(true)
      window.setTimeout(() => router.push('/app/overview'), 700)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر قبول الدعوة')
    } finally {
      setLoading(false)
    }
  }

  return <main className="auth-page"><header className="auth-header section-container"><Link href="/" className="brand" aria-label="العودة إلى الصفحة الرئيسية"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><Link href="/login" className="button button-outline"><ArrowLeft size={14} /> تسجيل الدخول</Link></header><section className="auth-shell section-container"><div className="auth-card"><div className="auth-card-icon"><Users size={22} /></div><div className="auth-heading"><span className="section-eyebrow"><span className="eyebrow-dot" />دعوة إلى مساحة عمل</span><h1>انضم إلى فريق <em>مركزية.</em></h1><p>أنشئ حساب SaaS جديدًا من خلال هذه الدعوة. لا تمنح الدعوة وصولًا إلى قاعدة بيانات LMS أو محتواه.</p></div>{success ? <div className="form-success" role="status"><CheckCircle2 size={18} /> تم قبول الدعوة. جارٍ فتح مساحة العمل...</div> : <form className="auth-form" onSubmit={submit}><label>اسمك الكامل<input required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} type="text" autoComplete="name" placeholder="أحمد علي" /></label><label>كلمة مرور جديدة<div className="input-with-icon"><LockKeyhole size={15} /><input required minLength={8} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="new-password" placeholder="8 أحرف على الأقل" /></div></label><p className="dashboard-footer-note"><Mail size={14} /> سيُستخدم البريد الموجود في الدعوة لإنشاء الحساب.</p>{error && <p className="form-error" role="alert">{error}</p>}<button disabled={loading} type="submit" className="button button-dark button-large">{loading ? 'جارٍ القبول...' : 'قبول الدعوة وإنشاء الحساب'} <ArrowLeft size={15} /></button></form>}</div></section></main>
}
