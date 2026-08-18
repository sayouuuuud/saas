import nodemailer, { type Transporter } from "nodemailer";

let cachedTransporter: Transporter | null | undefined;

function getAppUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}

function getFrom() {
  return process.env.EMAIL_FROM || "Centralia <no-reply@centralia.app>";
}

/**
 * Returns a shared SMTP transporter, or null when SMTP_CONNECTION_URL is not
 * configured (local development). Callers must fall back to logging in that case.
 */
function getTransporter(): Transporter | null {
  if (cachedTransporter !== undefined) return cachedTransporter;
  const connectionUrl = process.env.SMTP_CONNECTION_URL;
  if (!connectionUrl) {
    cachedTransporter = null;
    return null;
  }
  cachedTransporter = nodemailer.createTransport(connectionUrl);
  return cachedTransporter;
}

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Sends a transactional email. When SMTP_CONNECTION_URL is unset (local dev),
 * logs the email to the console instead of sending it so flows remain testable
 * without a mail server. Never throws — a delivery failure must not block the
 * request that triggered it (registration, invites, password resets).
 */
export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<{ delivered: boolean }> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[v0] SMTP_CONNECTION_URL not set — logging email instead of sending.\nTo: ${to}\nSubject: ${subject}\n${text}`);
    return { delivered: false };
  }
  try {
    await transporter.sendMail({ from: getFrom(), to, subject, html, text });
    return { delivered: true };
  } catch (error) {
    console.error("[v0] Failed to send email:", error instanceof Error ? error.message : error);
    return { delivered: false };
  }
}

function layout(title: string, bodyHtml: string) {
  return `<!doctype html>
<html lang="ar" dir="rtl">
  <body style="margin:0;padding:32px 16px;background:#f4f1ea;font-family:Tahoma,Arial,sans-serif;color:#1c1b19;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
      <p style="margin:0 0 24px;font-size:20px;font-weight:700;">مركزية</p>
      <h1 style="margin:0 0 16px;font-size:18px;">${title}</h1>
      ${bodyHtml}
      <p style="margin:32px 0 0;font-size:12px;color:#8a8578;">إذا لم تطلب هذا الإجراء، يمكنك تجاهل هذه الرسالة بأمان.</p>
    </div>
  </body>
</html>`;
}

function button(url: string, label: string) {
  return `<p style="text-align:center;margin:24px 0;"><a href="${url}" style="display:inline-block;background:#1c1b19;color:#f4f1ea;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;">${label}</a></p>
  <p style="font-size:12px;color:#8a8578;word-break:break-all;">${url}</p>`;
}

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${getAppUrl()}/verify-email?token=${token}`;
  return sendEmail({
    to,
    subject: "تأكيد بريدك الإلكتروني — مركزية",
    html: layout("تأكيد بريدك الإلكتروني", `<p style="margin:0 0 8px;font-size:14px;">مرحبًا، أكمل تسجيلك بالضغط على الزر أدناه. الرمز صالح لمدة 24 ساعة.</p>${button(url, "تأكيد البريد الإلكتروني")}`),
    text: `مرحبًا، أكمل تسجيلك عبر الرابط التالي (صالح 24 ساعة): ${url}`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${getAppUrl()}/reset-password?token=${token}`;
  return sendEmail({
    to,
    subject: "طلب استعادة كلمة المرور — مركزية",
    html: layout("استعادة كلمة المرور", `<p style="margin:0 0 8px;font-size:14px;">تلقينا طلبًا لاستعادة كلمة مرور حسابك. الرابط صالح لمدة ساعة واحدة.</p>${button(url, "إعادة تعيين كلمة المرور")}`),
    text: `تلقينا طلبًا لاستعادة كلمة مرور حسابك (صالح ساعة واحدة): ${url}`,
  });
}

export async function sendWorkspaceInviteEmail(to: string, token: string, workspaceName: string, roleLabel: string) {
  const url = `${getAppUrl()}/invite/${token}`;
  return sendEmail({
    to,
    subject: `دعوة للانضمام إلى ${workspaceName} — مركزية`,
    html: layout("دعوة إلى مساحة عمل", `<p style="margin:0 0 8px;font-size:14px;">تمت دعوتك للانضمام إلى <strong>${workspaceName}</strong> بصفة ${roleLabel}. الدعوة صالحة لفترة محدودة.</p>${button(url, "قبول الدعوة")}`),
    text: `تمت دعوتك للانضمام إلى ${workspaceName} بصفة ${roleLabel}: ${url}`,
  });
}
