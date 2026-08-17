'use client'

import Link from 'next/link'
import { ArrowRight, Check, RefreshCw, Save, Settings2, ShieldCheck } from 'lucide-react'
import { FormEvent, useEffect, useRef, useState } from 'react'

type User = { name: string; email: string; emailVerifiedAt: string | null }
type Workspace = { id: string; name: string }
type WorkspacePayload = { workspace: Workspace & { members?: { role: string; user: { email: string } }[] } }

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [name, setName] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [canRenameWorkspace, setCanRenameWorkspace] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void Promise.all([fetch('/api/me', { cache: 'no-store', signal: controller.signal }), fetch('/api/workspace', { cache: 'no-store', signal: controller.signal })]).then(async ([userResponse, workspaceResponse]) => {
        const userBody = await userResponse.json().catch(() => ({})); const workspaceBody = await workspaceResponse.json().catch(() => ({}))
        if (!userResponse.ok || !workspaceResponse.ok) throw new Error(userBody.error || workspaceBody.error || 'تعذر تحميل الإعدادات')
        const typedWorkspace = workspaceBody as WorkspacePayload
        const membership = typedWorkspace.workspace.members?.find((member) => member.user.email === userBody.user.email)
        setUser(userBody.user); setName(userBody.user.name); setWorkspace(typedWorkspace.workspace); setWorkspaceName(typedWorkspace.workspace.name); setCanRenameWorkspace(membership ? ['OWNER', 'BILLING_MANAGER'].includes(membership.role) : false)
      }).catch((loadError) => { if (!(loadError instanceof DOMException && loadError.name === 'AbortError')) setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل الإعدادات') }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    }, 0)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [])

  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('')
    try {
      const profileResponse = await fetch('/api/me', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name }), cache: 'no-store' })
      const profileBody = await profileResponse.json().catch(() => ({}))
      if (!profileResponse.ok) throw new Error(profileBody.error || 'تعذر حفظ اسم الحساب')
      let savedWorkspaceName = workspaceName
      if (canRenameWorkspace && workspace && workspaceName.trim() !== workspace.name) {
        const workspaceResponse = await fetch('/api/workspace', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: workspaceName }), cache: 'no-store' })
        const workspaceBody = await workspaceResponse.json().catch(() => ({}))
        if (!workspaceResponse.ok) throw new Error(workspaceBody.error || 'تعذر حفظ مساحة العمل')
        savedWorkspaceName = workspaceBody.workspace.name
        setWorkspace(workspaceBody.workspace)
      }
      setUser((current) => current ? { ...current, name: profileBody.user.name } : current); setName(profileBody.user.name); setWorkspaceName(savedWorkspaceName); setSuccess(canRenameWorkspace ? 'تم حفظ الإعدادات بنجاح.' : 'تم حفظ اسم الحساب. تغيير مساحة العمل متاح لمالكها أو مدير الفوترة.')
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'تعذر حفظ الإعدادات') } finally { setSaving(false) }
  }

  return <main className="billing-page"><header className="billing-header section-container"><Link href="/dashboard" className="brand" aria-label="العودة إلى لوحة التحكم"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><Link href="/dashboard" className="button button-outline"><ArrowRight size={14} /> العودة للوحة التحكم</Link></header><section className="billing-content section-container"><div className="billing-heading"><div><span className="section-eyebrow"><span className="eyebrow-dot" />الإعدادات</span><h1>إعدادات بسيطة، <em>بسيطرة واضحة.</em></h1><p>حدّث اسمك واسم مساحة العمل من خلال APIs SaaS المصرح بها. البريد الإلكتروني وحالة التحقق معروضان للمراجعة فقط في هذه الشاشة.</p></div><div className="billing-security"><ShieldCheck size={16} /><span>حفظ خاص وغير قابل للتخزين العام</span></div></div>{error && <div ref={errorRef} tabIndex={-1} className="form-error" role="alert"><span>{error}</span><button type="button" className="text-button" onClick={() => window.location.reload()}><RefreshCw size={14} /> إعادة المحاولة</button></div>}{success && <div className="connected-badge" role="status"><Check size={14} /> {success}</div>}{loading ? <div className="invoice-empty" role="status">جارٍ تحميل الإعدادات...</div> : user && workspace ? <form className="auth-card settings-form" onSubmit={save}><label>اسم الحساب<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={120} required /></label><label>البريد الإلكتروني<input value={user.email} readOnly aria-describedby="email-note" /></label><small id="email-note">لتغيير البريد، استخدم مسار التحقق المخصص للحساب.</small><label>اسم مساحة العمل<input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} minLength={2} maxLength={120} required disabled={!canRenameWorkspace} aria-describedby="workspace-note" /></label><small id="workspace-note">{canRenameWorkspace ? 'لديك صلاحية تعديل اسم مساحة العمل.' : 'تعديل الاسم متاح لمالك مساحة العمل أو مدير الفوترة فقط.'}</small><div className="dashboard-footer-note"><Settings2 size={15} /> حالة البريد: {user.emailVerifiedAt ? `تم التحقق في ${new Date(user.emailVerifiedAt).toLocaleDateString('ar-EG')}` : 'لم يتم التحقق بعد'}</div><button type="submit" className="button button-dark" disabled={saving}><Save size={16} /> {saving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}</button></form> : null}<div className="billing-help"><ShieldCheck size={16} /><div><b>حدود الإعدادات</b><span>هذه الشاشة لا تنفذ تغييرات خارج SaaS، ولا تقرأ أو تعدل قاعدة بيانات LMS. تغيير البريد الإلكتروني يتطلب مسار تحقق مستقلًا لحماية الحساب.</span></div></div></section></main>
}
