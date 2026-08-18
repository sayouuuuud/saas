import { strict as assert } from 'node:assert'
import { canAccessStaffSection } from '../lib/staff-access'

const cases: Array<[string, string, boolean]> = [
  ['ADMIN', 'settings', true],
  ['ADMIN', 'staff', true],
  ['BILLING', 'billing', true],
  ['BILLING', 'coupons', true],
  ['BILLING', 'support', false],
  ['SUPPORT', 'support', true],
  ['SUPPORT', 'billing', false],
  ['ANALYST', 'reports', true],
  ['ANALYST', 'usage', true],
  ['ANALYST', 'settings', false],
]

for (const [role, section, expected] of cases) {
  assert.equal(canAccessStaffSection(role as never, section), expected, `${role} access to ${section}`)
}

console.log('Staff role access smoke passed')
