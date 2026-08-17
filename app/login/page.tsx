'use client'

import Link from 'next/link'
import { ArrowLeft, Check, LockKeyhole, Mail, Sparkles } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = mode === 'signup' ? '/api/auth/register' : '/api/auth/login'
      const body = mode === 'signup' ? { name, email, password } : { email, password }
      const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'تعذر إتمام العملية')
      router.push('/dashboard')
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'تعذر إتمام العملية')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel auth-brand-panel">
        <Link href="/" className="brand auth-brand"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link>
        <div className="auth-brand-copy">
          <span className="section-eyebrow"><span className="eyebrow-dot" />مساحتك تبدأ من هنا</span>
          <h1>وضوح أكثر،<br /><em>من أول يوم.</em></h1>
          <p>أنشئ حسابك وأدر اشتراكك وفواتيرك ورابط منصتك التعليمية من مساحة واحدة هادئة وواضحة.</p>
          <div className="auth-checks">
            <span><Check size={14} /> تجربة مجانية لمدة 14 يومًا</span>
            <span><Check size={14} /> لا بطاقة مطلوبة للبدء</span>
            <span><Check size={14} /> بياناتك تبقى منفصلة عن LMS</span>
          </div>
        </div>
        <div className="auth-footer-note">© 2025 مركزية · مبنية للوضوح، لا للتعقيد.</div>
      </section>
      <section className="auth-panel auth-form-panel">
        <Link href="/" className="auth-back"><ArrowLeft size={15} /> العودة للرئيسية</Link>
        <div className="auth-form-wrap">
          <div className="auth-form-heading">
            <span className="auth-icon"><Sparkles size={17} /></span>
            <h2>{mode === 'signup' ? 'ابدأ تجربتك الآن' : 'مرحبًا بعودتك'}</h2>
            <p>{mode === 'signup' ? 'أنشئ حسابك في أقل من دقيقتين.' : 'سجّل الدخول إلى مساحة عملك في مركزية.'}</p>
          </div>
          <form className="auth-form" onSubmit={submit}>
            {mode === 'signup' && <label>الاسم الكامل<input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} type="text" placeholder="أحمد علي" /></label>}
            <label>البريد الإلكتروني<div className="input-with-icon"><Mail size={15} /><input required value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" /></div></label>
            <label>كلمة المرور<div className="input-with-icon"><LockKeyhole size={15} /><input required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="8 أحرف على الأقل" /></div></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button disabled={loading} type="submit" className="button button-dark button-large">{loading ? 'جارٍ التنفيذ...' : mode === 'signup' ? 'أنشئ حسابك' : 'تسجيل الدخول'} <ArrowLeft size={15} /></button>
          </form>
          <div className="auth-switch">{mode === 'signup' ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب؟'} <button onClick={() => { setError(''); setMode(mode === 'signup' ? 'login' : 'signup') }}>{mode === 'signup' ? 'تسجيل الدخول' : 'ابدأ مجانًا'}</button></div>
          <small className="auth-legal">بالمتابعة، أنت توافق على الشروط وسياسة الخصوصية الخاصة بمركزية.</small>
        </div>
      </section>
    </main>
  )
}
