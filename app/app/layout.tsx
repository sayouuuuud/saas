import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'حسابك | مركزية',
    template: '%s | مركزية',
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
