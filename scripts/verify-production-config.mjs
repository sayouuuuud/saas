const isProduction = process.argv.includes('--strict') || process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'

if (!isProduction) {
  console.log('Production configuration check skipped (use --strict or NODE_ENV=production).')
  process.exit(0)
}

const errors = []
const databaseUrl = process.env.DATABASE_URL ?? ''
const sessionSecret = process.env.SESSION_SECRET ?? ''
const billingWebhookSecret = process.env.BILLING_WEBHOOK_SECRET ?? ''
const appUrl = process.env.APP_URL ?? ''
const paymentProvider = (process.env.PAYMENT_PROVIDER ?? 'stripe').toLowerCase()

if (!databaseUrl || databaseUrl.startsWith('file:')) {
  errors.push('DATABASE_URL must be a PostgreSQL connection string in production; SQLite file URLs are development-only.')
} else {
  try {
    const parsedDatabaseUrl = new URL(databaseUrl)
    if (!['postgres:', 'postgresql:'].includes(parsedDatabaseUrl.protocol)) {
      errors.push('DATABASE_URL must use the postgres:// or postgresql:// protocol in production.')
    }
    const sslMode = parsedDatabaseUrl.searchParams.get('sslmode')
    if (!['require', 'verify-ca', 'verify-full'].includes(sslMode ?? '')) {
      errors.push('DATABASE_URL must set sslmode=require, verify-ca, or verify-full in production.')
    }
    if (!parsedDatabaseUrl.hostname || !parsedDatabaseUrl.pathname || parsedDatabaseUrl.pathname === '/') {
      errors.push('DATABASE_URL must include a PostgreSQL host and database name in production.')
    }
  } catch {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string in production.')
  }
}
if (sessionSecret.length < 32 || sessionSecret.includes('replace-with-')) {
  errors.push('SESSION_SECRET must contain at least 32 non-placeholder characters.')
}
if (billingWebhookSecret.length < 32 || billingWebhookSecret.includes('replace-with-')) {
  errors.push('BILLING_WEBHOOK_SECRET must contain at least 32 non-placeholder characters.')
}
try {
  const parsedUrl = new URL(appUrl)
  if (parsedUrl.protocol !== 'https:') errors.push('APP_URL must use HTTPS in production.')
} catch {
  errors.push('APP_URL must be a valid HTTPS URL in production.')
}
if (paymentProvider !== 'mock' && !process.env.STRIPE_SECRET_KEY) {
  errors.push('STRIPE_SECRET_KEY is required when PAYMENT_PROVIDER is not mock.')
}
if (paymentProvider !== 'mock' && !process.env.STRIPE_WEBHOOK_SECRET) {
  errors.push('STRIPE_WEBHOOK_SECRET is required when PAYMENT_PROVIDER is not mock.')
}
const smtpConnectionUrl = process.env.SMTP_CONNECTION_URL ?? ''
if (!smtpConnectionUrl) {
  errors.push('SMTP_CONNECTION_URL is required in production so verification, password reset, and invite emails can be delivered.')
} else {
  try {
    const parsedSmtpUrl = new URL(smtpConnectionUrl)
    if (!['smtp:', 'smtps:'].includes(parsedSmtpUrl.protocol)) {
      errors.push('SMTP_CONNECTION_URL must use the smtp:// or smtps:// protocol.')
    }
  } catch {
    errors.push('SMTP_CONNECTION_URL must be a valid SMTP connection string.')
  }
}

if (errors.length) {
  console.error('Production configuration check failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('Production configuration check passed: PostgreSQL TLS, HTTPS, secrets, and billing prerequisites are present.')
