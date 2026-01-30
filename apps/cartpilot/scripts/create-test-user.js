#!/usr/bin/env node
/**
 * Create (or verify) the E2E test user in Supabase Auth.
 * Load env from .env.local (run: node --env-file=.env.local scripts/create-test-user.js)
 * Then set TEST_USER_EMAIL and TEST_USER_PASSWORD for Playwright, or use .env.test.
 */

const { createClient } = require('@supabase/supabase-js')

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'olive-e2e-test@example.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  console.error('Run with: node --env-file=.env.local scripts/create-test-user.js')
  process.exit(1)
}

const supabase = createClient(url, anonKey)

async function main() {
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    options: { emailRedirectTo: undefined },
  })

  if (!signUpError) {
    if (signUpData?.user?.identities?.length === 0) {
      // User already exists (Supabase returns this when email is taken)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })
      if (signInError) {
        console.error('Test user exists but password does not match. Reset the user password in Supabase Dashboard (Auth > Users) to:', TEST_PASSWORD)
        process.exit(1)
      }
      console.log('Test user already exists and password is correct.')
    } else {
      console.log('Test user created. If your project requires email confirmation, confirm the email in Supabase Dashboard (Auth > Users) or disable "Confirm email" for testing.')
    }
  } else {
    if (signUpError.message?.includes('Invalid API key') || signUpError.message?.includes('JWT')) {
      console.error('Supabase API key is invalid or missing. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (use project rbfzlqmkwhbvrrfdcain).')
      process.exit(1)
    }
    if (signUpError.message?.includes('already registered') || signUpError.message?.toLowerCase().includes('already')) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })
      if (signInError) {
        console.error('User exists but sign-in failed:', signInError.message)
        console.error('Reset the test user password in Supabase Dashboard to:', TEST_PASSWORD)
        process.exit(1)
      }
      console.log('Test user already exists and password is correct.')
    } else {
      console.error('Sign up failed:', signUpError.message)
      process.exit(1)
    }
  }

  console.log('')
  console.log('Add to .env.test (or export) to run authenticated E2E tests:')
  console.log('TEST_USER_EMAIL=' + TEST_EMAIL)
  console.log('TEST_USER_PASSWORD=' + TEST_PASSWORD)
  console.log('')
  console.log('Then run: npm run test:e2e')
}

main()
