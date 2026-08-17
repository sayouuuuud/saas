"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Mode = "verify" | "forgot" | "reset";

export default function AuthActionForm({ mode }: { mode: Mode }) {
  const [token, setToken] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("token") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; text: string }>({ type: "idle", text: "" });
  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus({ type: "loading", text: "جارٍ التنفيذ…" });
    const endpoint = mode === "verify" ? "/api/auth/verify" : mode === "forgot" ? "/api/auth/forgot-password" : "/api/auth/reset-password";
    const body = mode === "verify" ? { token } : mode === "forgot" ? { email } : { token, password };
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setStatus({ type: "error", text: data.error || "تعذر إتمام العملية" });
    if (data.resetToken && mode === "forgot") setStatus({ type: "success", text: `تم إنشاء الطلب. رمز الاختبار المحلي: ${data.resetToken}` });
    else setStatus({ type: "success", text: mode === "verify" ? "تم التحقق من البريد بنجاح." : mode === "reset" ? "تم تغيير كلمة المرور. سجّل الدخول من جديد." : "تم قبول الطلب. إذا كان البريد موجودًا فستصلك تعليمات الاستعادة." });
  }
  const title = mode === "verify" ? "تحقق من بريدك" : mode === "forgot" ? "استعادة كلمة المرور" : "تعيين كلمة مرور جديدة";
  const description = mode === "verify" ? "أدخل رمز التحقق الذي وصلك لإكمال إعداد الحساب." : mode === "forgot" ? "سنقبل الطلب دون كشف ما إذا كان البريد مسجلًا." : "استخدم رمزًا صالحًا واختر كلمة مرور من 8 أحرف على الأقل.";
  return <main className="auth-action-page"><div className="auth-action-card"><Link href="/" className="brand"><span className="brand-mark"><span /><span /><span /></span>مركزية</Link><span className="section-eyebrow"><span className="eyebrow-dot" />أمان الحساب</span><h1>{title}</h1><p>{description}</p><form onSubmit={submit}>{mode !== "verify" && mode !== "reset" && <label>البريد الإلكتروني<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>}{(mode === "verify" || mode === "reset") && <label>رمز الأمان<input value={token} onChange={(event) => setToken(event.target.value)} required /></label>}{mode === "reset" && <label>كلمة المرور الجديدة<input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>}<button className="button button-dark" disabled={status.type === "loading"}>{status.type === "loading" ? "جارٍ التنفيذ…" : "متابعة"}</button></form>{status.text && <p className={`auth-action-status ${status.type}`}>{status.text}</p>}<div className="auth-action-links"><Link href="/login">تسجيل الدخول</Link><Link href="/contact">التواصل مع الدعم</Link></div></div></main>;
}
