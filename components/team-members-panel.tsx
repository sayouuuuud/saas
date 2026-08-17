"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, RefreshCw, Users } from "lucide-react";

type TeamMember = {
  id: string;
  role: string;
  user: { id: string; name: string; email: string };
};

const roleLabels: Record<string, string> = {
  OWNER: "المالك",
  BILLING_MANAGER: "مدير الفوترة",
  VIEWER: "مشاهد",
  ANALYST: "محلل",
};

export default function TeamMembersPanel({ initialMembers, initialNextOffset }: { initialMembers: TeamMember[]; initialNextOffset: number | null }) {
  const [members, setMembers] = useState(initialMembers);
  const [nextOffset, setNextOffset] = useState(initialNextOffset);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  async function loadMore() {
    if (nextOffset === null || loading) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/workspace?memberLimit=25&memberOffset=${nextOffset}`, { signal: controller.signal });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "تعذر تحميل أعضاء إضافيين");
      if (controller.signal.aborted) return;
      const page = Array.isArray(payload.workspace?.members) ? payload.workspace.members : [];
      setMembers((current) => [...current, ...page]);
      setNextOffset(typeof payload.membersPagination?.nextOffset === "number" ? payload.membersPagination.nextOffset : null);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "تعذر تحميل أعضاء إضافيين");
    } finally {
      if (!controller.signal.aborted && controllerRef.current === controller) {
        setLoading(false);
        controllerRef.current = null;
      }
    }
  }

  return (
    <article className="workspace-panel team-members-panel" aria-labelledby="team-members-title">
      <div className="workspace-panel-heading"><div><b id="team-members-title">أعضاء مساحة العمل</b><span>الأدوار المعروضة من SaaS فقط.</span></div><Users size={17} aria-hidden="true" /></div>
      {members.length ? <div className="team-member-list" role="list" aria-label="أعضاء مساحة العمل">{members.map((member) => <div className="team-member-row" key={member.id} role="listitem"><span className="team-member-avatar" aria-hidden="true">{member.user.name.slice(0, 1) || "م"}</span><span className="team-member-meta"><b>{member.user.name}</b><small>{member.user.email}</small></span><span className="team-member-role">{roleLabels[member.role] || member.role}</span></div>)}</div> : <p className="workspace-empty">لا يوجد أعضاء إضافيون في مساحة العمل.</p>}
      {error && <p className="team-member-error" role="alert" aria-live="assertive">{error}</p>}
      {nextOffset !== null && <button type="button" className="text-button team-member-more" onClick={() => void loadMore()} disabled={loading} aria-busy={loading}>{loading ? <><RefreshCw size={14} className="spin" /> جارٍ التحميل...</> : <><ArrowLeft size={14} /> {error ? "إعادة المحاولة" : "تحميل أعضاء إضافيين"}</>}</button>}
    </article>
  );
}
