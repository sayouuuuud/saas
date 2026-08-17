export default function WorkspaceLoading() {
  return (
    <main className="auth-required" role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden="true" />
      <h1>جارٍ تحميل مساحة العمل</h1>
      <p>نجهز مؤشرات SaaS الخاصة بمساحة العمل المصرح بها.</p>
    </main>
  )
}
