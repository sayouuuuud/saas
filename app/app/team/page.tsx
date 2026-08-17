'use client'

import Link from 'next/link'
import { ArrowRight, Ban, Copy, RefreshCw, Send, ShieldCheck, Users } from 'lucide-react'
import { FormEvent, useEffect, useRef, useState } from 'react'

type TeamMember = { id: string; role: string; user: { id: string; name: string; email: string } }
type TeamPayload = { workspace: { name: string; members: TeamMember[] }; membersPagination?: { hasMore: boolean } }
type Invite = { id: string; email: string; role: string; expiresAt: string; acceptedAt: string | null; revokedAt: string | null; createdAt: string }

const roleLabels: Record<string, string> = {
  OWNER: 'المالك',
  BILLING_MANAGER: 'مدير الفوترة',
  VIEWER: 'مشاهد',
  ANALYST: 'محلل',
  SUPPORT_CONTACT: 'جهة اتصال للدعم',
}

export default function TeamPage() {
  const [payload, setPayload] = useState<TeamPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invites, setInvites] = useState<Invite[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('VIEWER')
  const [inviteUrl, setInviteUrl] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const errorRef = useRef<HTMLDivElement>(null)

  async function load(signal?: AbortSignal) {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/workspace?memberLimit=50&memberOffset=0', { cache: 'no-store', signal })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'تعذر تحميل أعضاء الفريق')
      const members = Array.isArray(body.workspace?.members) ? body.workspace.members : []
      setPayload({ workspace: { name: body.workspace?.name || 'مساحة العمل', members }, membersPagination: body.membersPagination })
      const invitesResponse = await fetch('/api/workspace/invites?limit=25&offset=0', { cache: 'no-store', signal })
      const invitesBody = await invitesResponse.json().catch(() => ({}))
      if (invitesResponse.ok) setInvites(Array.isArray(invitesBody.invites) ? invitesBody.invites : [])
    } catch (loadError) {
      if (!(loadError instanceof DOMException && loadError.name === 'AbortError')) setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل أعضاء الفريق')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => { void load(controller.signal) }, 0)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [])
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  async function createInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setInviteLoading(true)
    setInviteError('')
    setInviteUrl('')
    try {
      const response = await fetch('/api/workspace/invites', { method: 'POST', cache: 'no-store', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: inviteEmail, role: inviteRole, expiresInDays: 7 }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'تعذر إنشاء الدعوة')
      setInviteUrl(body.invite?.inviteUrl || '')
      setInvites((current) => [{ ...body.invite, acceptedAt: null, revokedAt: null, createdAt: new Date().toISOString() }, ...current])
      setInviteEmail('')
    } catch (cause) {
      setInviteError(cause instanceof Error ? cause.message : 'تعذر إنشاء الدعوة')
    } finally {
      setInviteLoading(false)
    }
  }

  async function revokeInvite(id: string) {
    setInviteError('')
    try {
      const response = await fetch(`/api/workspace/invites/${id}`, { method: 'POST', cache: 'no-store' })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'تعذر إلغاء الدعوة')
      setInvites((current) => current.map((invite) => invite.id === id ? { ...invite, revokedAt: new Date().toISOString() } : invite))
    } catch (cause) {
      setInviteError(cause instanceof Error ? cause.message : 'تعذر إلغاء الدعوة')
    }
  }

  async function copyInviteUrl() {
    if (inviteUrl) await navigator.clipboard?.writeText(inviteUrl)
  }

  return (
    <main className="billing-page">
      <header className="billing-header section-container"><Link href="/dashboard" className="brand" aria-label="العودة إلى لوحة التحكم"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><Link href="/dashboard" className="button button-outline"><ArrowRight size={14} /> العودة للوحة التحكم</Link></header>
      <section className="billing-content section-container">
        <div className="billing-heading"><div><span className="section-eyebrow"><span className="eyebrow-dot" />إدارة الفريق</span><h1>فريقك، <em>بوضوح.</em></h1><p>نعرض أعضاء مساحة العمل وأدوارهم من قاعدة SaaS فقط. لا نعرض بيانات تشغيلية من LMS ولا نفترض صلاحيات غير موجودة.</p></div><div className="billing-security"><ShieldCheck size={16} /><span>بيانات الفريق مملوكة لـ SaaS</span></div></div>
        {error && <div ref={errorRef} tabIndex={-1} className="form-error" role="alert"><span>{error}</span><button type="button" className="text-button" onClick={() => void load()} disabled={loading}><RefreshCw size={14} /> إعادة المحاولة</button></div>}
        {loading ? <div className="invoice-empty" role="status">جارٍ تحميل أعضاء الفريق...</div> : payload ? <>
          <div className="dashboard-footer-note"><Users size={15} /> مساحة العمل: {payload.workspace.name} · {payload.workspace.members.length} عضوًا في الصفحة الحالية</div>
          <div className="workspace-panel team-members-panel"><div className="workspace-panel-heading"><div><b id="team-members-title">أعضاء مساحة العمل</b><span>الأدوار المعروضة من SaaS فقط.</span></div><Users size={17} aria-hidden="true" /></div>{payload.workspace.members.length ? <div className="team-member-list" role="list" aria-labelledby="team-members-title">{payload.workspace.members.map((member) => <div className="team-member-row" key={member.id} role="listitem"><span className="team-member-avatar" aria-hidden="true">{member.user.name.slice(0, 1) || 'م'}</span><span className="team-member-meta"><b>{member.user.name}</b><small>{member.user.email}</small></span><span className="team-member-role">{roleLabels[member.role] || member.role}</span></div>)}</div> : <p className="workspace-empty">لا يوجد أعضاء إضافيون في مساحة العمل.</p>}{payload.membersPagination?.hasMore && <p className="dashboard-footer-note">توجد صفحات إضافية من الأعضاء، وتبقى كل صفحة محدودة لحماية الأداء.</p>}</div>
          <section className="workspace-panel" aria-labelledby="invite-title"><div className="workspace-panel-heading"><div><b id="invite-title">دعوة عضو جديد</b><span>الدعوة تخص مساحة SaaS فقط وتنتهي بعد 7 أيام.</span></div><Send size={17} aria-hidden="true" /></div><form className="inline-form" onSubmit={createInvite}><label>البريد الإلكتروني<input required type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="teammate@example.com" /></label><label>الدور<select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)}><option value="VIEWER">مشاهد</option><option value="ANALYST">محلل</option><option value="SUPPORT_CONTACT">جهة اتصال للدعم</option><option value="BILLING_MANAGER">مدير الفوترة</option></select></label><button disabled={inviteLoading} type="submit" className="button button-dark">{inviteLoading ? 'جارٍ الإنشاء...' : 'إنشاء دعوة'} <Send size={14} /></button></form>{inviteUrl && <div className="form-success" role="status"><span>تم إنشاء الرابط:</span><code>{inviteUrl}</code><button type="button" className="text-button" onClick={() => void copyInviteUrl()}><Copy size={14} /> نسخ الرابط</button></div>}{inviteError && <p className="form-error" role="alert">{inviteError}</p>}</section>
          <section className="workspace-panel" aria-labelledby="pending-invites-title"><div className="workspace-panel-heading"><div><b id="pending-invites-title">الدعوات الأخيرة</b><span>لا نعرض رموز الدعوات المخزنة؛ يظهر الرابط مرة واحدة عند الإنشاء.</span></div><Send size={17} aria-hidden="true" /></div>{invites.length ? <div className="team-member-list" role="list" aria-label="دعوات مساحة العمل">{invites.map((invite) => <div className="team-member-row" key={invite.id}><span className="team-member-avatar" aria-hidden="true"><Send size={14} /></span><span className="team-member-meta"><b>{invite.email}</b><small>{roleLabels[invite.role] || invite.role} · {invite.acceptedAt ? 'تم القبول' : invite.revokedAt ? 'ملغاة' : new Date(invite.expiresAt).toLocaleDateString('ar-EG')}</small></span>{!invite.acceptedAt && !invite.revokedAt && <button type="button" className="text-button" onClick={() => void revokeInvite(invite.id)}><Ban size={14} /> إلغاء</button>}</div>)}</div> : <p className="workspace-empty">لا توجد دعوات بعد.</p>}</section>
          <div className="billing-help"><ShieldCheck size={16} /><div><b>حدود الفريق</b><span>الأدوار هنا لإدارة مساحة SaaS فقط. لا تعني حالة العضو أو دوره امتلاك وصول إلى قاعدة LMS أو صحة نظام LMS.</span></div></div>
        </> : null}
      </section>
    </main>
  )
}
