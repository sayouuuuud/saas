'use client'

import Link from 'next/link'
import { ArrowLeft, Check, LockKeyhole, Mail, Sparkles } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verificationToken, setVerificationToken] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/auth/register', { cache: 'no-store',
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || 'تعذر إنشاء الحساب')
      if (payload?.verificationToken) setVerificationToken(payload.verificationToken)
      router.push('/verify-email')
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'تعذر إنشاء الحساب')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page" dir="rtl">
      <section className="auth-panel auth-brand-panel">
        <Link href="/" className="brand auth-brand"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link>
        <div className="auth-brand-copy">
          <span className="section-eyebrow"><span className="eyebrow-dot" />رحلة SaaS واضحة</span>
          <h1>ابدأ من مساحة،<br /><em>تملكها أنت.</em></h1>
          <p>أنشئ حسابك لإدارة اشتراكك وفواتيرك وفريقك ورابط منصتك التعليمية، دون أن تنشئ مركزية LMS أو تنسخ محتواه.</p>
          <div className="auth-checks">
            <span><Check size={14} /> تجربة أولية بخطة Starter</span>
            <span><Check size={14} /> تحقق من البريد قبل المتابعة</span>
            <span><Check size={14} /> لا نخزن بيانات بطاقة</span>
          </div>
        </div>
        <div className="auth-footer-note">© 2026 مركزية · مبنية للوضوح، لا للتعقيد.</div>
      </section>
      <section className="auth-panel auth-form-panel">
        <Link href="/" className="auth-back"><ArrowLeft size={15} /> العودة للرئيسية</Link>
        <div className="auth-form-wrap">
          <div className="auth-form-heading">
            <span className="auth-icon"><Sparkles size={17} /></span>
            <h2>أنشئ حساب مركزية</h2>
            <p>ابدأ بالبيانات الأساسية، ثم أكمل التحقق والملف التجاري من داخل حسابك.</p>
          </div>
          <form className="auth-form" onSubmit={submit}>
            <label>الاسم الكامل<input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} type="text" autoComplete="name" placeholder="أحمد علي" /></label>
            <label>البريد الإلكتروني<div className="input-with-icon"><Mail size={15} /><input required value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="you@example.com" /></div></label>
            <label>كلمة المرور<div className="input-with-icon"><LockKeyhole size={15} /><input required minLength={6} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="new-password" placeholder="6 أحرف على الأقل" /></div></label>
            <label className="auth-consent"><input required type="checkbox" /> أوافق على <Link href="/terms">الشروط</Link> و<Link href="/privacy">سياسة الخصوصية</Link>.</label>
            {error && <p className="form-error" role="alert">{error}</p>}
            {verificationToken && <p className="form-success" role="status">تم إنشاء الحساب. أكمل تحقق البريد من الصفحة التالية.</p>}
            <button disabled={loading} type="submit" className="button button-dark button-large">{loading ? 'جارٍ إنشاء الحساب...' : 'أنشئ حسابك'} <ArrowLeft size={15} /></button>
          </form>
          <div className="auth-switch">لديك حساب بالفعل؟ <Link href="/login">تسجيل الدخول</Link></div>
          <small className="auth-legal">لن نعرض حسابًا أو بريدًا في واجهات عامة، ولن نطلب منك بيانات بطاقة داخل التذاكر.</small>
        </div>
      </section>
    </main>
  )
}
