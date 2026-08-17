'use client'

import Link from 'next/link'
import { ArrowRight, RefreshCw, ShieldAlert } from 'lucide-react'

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="admin-guard" role="alert">
      <ShieldAlert size={28} aria-hidden="true" />
      <h1>تعذر تحميل مساحة الإدارة</h1>
      <p>حدث خطأ مؤقت أثناء قراءة بيانات تشغيل SaaS. لم نعرض تفاصيل داخلية، ويمكنك إعادة المحاولة بأمان.</p>
      <div className="billing-plan-actions">
        <button type="button" className="button button-dark" onClick={() => reset()}>
          <RefreshCw size={14} /> إعادة المحاولة
        </button>
        <Link href="/admin" className="button button-outline">
          <ArrowRight size={14} /> لوحة الإدارة
        </Link>
      </div>
    </main>
  )
}
