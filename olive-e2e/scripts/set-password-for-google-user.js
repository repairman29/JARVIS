#!/usr/bin/env node
/**
 * Set a password for your existing Google-login user so e2e can use email/password.
 * Run once, then put TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.test — no browser auth-setup needed.
 *
 * Usage:
 *   node scripts/set-password-for-google-user.js <your@gmail.com> <YourPassword>
 *
 * Requires in .env.test or .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
const path = require('path')
const fs = require('fs')

function loadEnv(file) {
  const p = path.resolve(process.cwd(), file)
  if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
}

loadEnv('.env.test')
loadEnv('.env.local')
loadEnv('.env')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.error('Usage: node scripts/set-password-for-google-user.js <your@gmail.com> <YourPassword>')
  process.exit(1)
}

if (!url || !serviceRole) {
  console.error('Missing Supabase config. Add to .env.test or .env.local:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL')
  console.error('  SUPABASE_SERVICE_ROLE_KEY (from Supabase Dashboard → Project → Settings → API → service_role)')
  process.exit(1)
}

async function main() {
  const { createClient } = require('@supabase/supabase-js')
  const admin = createClient(url, serviceRole)
  const { data: listData, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) {
    console.error('List users error:', listError.message)
    process.exit(1)
  }
  const user = listData?.users?.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase())
  if (!user) {
    console.error('No user found with email:', email)
    console.error('Sign in once with Google at your app (e.g. shopolive.xyz) so the user exists, then run this again.')
    process.exit(1)
  }
  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, { password })
  if (updateError) {
    console.error('Update password error:', updateError.message)
    process.exit(1)
  }
  console.log('Password set for', email)
  console.log('Add to .env.test:')
  console.log('  TEST_USER_EMAIL=' + email)
  console.log('  TEST_USER_PASSWORD=<the password you just set>')
  console.log('Then run: npm run test:e2e  (or npm run test:e2e:dashboard-authed)')
}

main()
