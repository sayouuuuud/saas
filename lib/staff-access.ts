import type { StaffRole } from '@prisma/client'

export const staffRoleLabels: Record<StaffRole, string> = {
  ADMIN: 'مدير النظام',
  BILLING: 'الفوترة',
  SUPPORT: 'الدعم',
  ANALYST: 'محلل',
}

const sectionAccess: Record<string, StaffRole[]> = {
  teachers: ['ADMIN', 'SUPPORT', 'ANALYST'],
  plans: ['ADMIN', 'BILLING', 'ANALYST'],
  subscriptions: ['ADMIN', 'BILLING', 'SUPPORT', 'ANALYST'],
  billing: ['ADMIN', 'BILLING'],
  'lms-links': ['ADMIN', 'SUPPORT', 'ANALYST'],
  integrations: ['ADMIN', 'SUPPORT', 'ANALYST'],
  usage: ['ADMIN', 'ANALYST'],
  reports: ['ADMIN', 'BILLING', 'ANALYST'],
  support: ['ADMIN', 'SUPPORT'],
  staff: ['ADMIN'],
  audit: ['ADMIN', 'ANALYST'],
  notifications: ['ADMIN', 'SUPPORT'],
  coupons: ['ADMIN', 'BILLING'],
  webhooks: ['ADMIN', 'BILLING'],
  settings: ['ADMIN'],
}

export function canAccessStaffSection(role: StaffRole, section: string) {
  return sectionAccess[section]?.includes(role) ?? false
}

export function accessibleStaffSections(role: StaffRole) {
  return Object.keys(sectionAccess).filter((section) => canAccessStaffSection(role, section))
}
