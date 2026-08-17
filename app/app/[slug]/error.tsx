'use client'

import { useEffect } from 'react'
import { ShieldAlert } from 'lucide-react'

export default function WorkspaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="auth-required" role="alert">
      <ShieldAlert size={30} aria-hidden="true" />
      <h1>تعذر تحميل مساحة العمل</h1>
      <p>حدث خطأ مؤقت أثناء قراءة بيانات SaaS. لم يتم عرض بيانات غير مؤكدة.</p>
      <button type="button" className="button button-dark" onClick={() => reset()}>إعادة المحاولة</button>
    </main>
  )
}
