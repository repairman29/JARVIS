'use client'

import { useState, Suspense, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SignInWithGoogle } from './SignInWithGoogle'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const thenConnect = searchParams.get('then') === 'connect'

  useEffect(() => {
    if (searchParams.get('error') === 'auth_callback') {
      setError('Sign-in was cancelled or failed. Try again or use email.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Olive is not configured yet. Please check the Supabase keys.')
      }
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setMessage('Check your email for the confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push(thenConnect ? '/dashboard?connectKroger=1' : '/dashboard')
      }
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_grant') || err?.status === 400) {
        setError('Invalid email or password. Check your details or create an account.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <Link href="/" className="flex items-center justify-center gap-2 mb-10">
          <div className="w-10 h-10 bg-[var(--sage)] rounded-full flex items-center justify-center olive-pulse">
            <span className="text-white text-lg">🫒</span>
          </div>
          <span className="text-2xl font-medium text-[var(--sage-advice)]">Olive</span>
        </Link>

        <div className="bg-[var(--card)] p-8 rounded-3xl shadow-sm border border-[var(--border)]">
          {!isSupabaseConfigured && (
            <div className="bg-[#fff7ed] dark:bg-[#2d1a0e] text-[var(--heirloom-tomato)] p-3 rounded-xl text-sm mb-4">
              Olive isn&apos;t configured yet. Add Supabase keys to continue.
            </div>
          )}
          <h2 className="text-xl font-medium text-[var(--cast-iron)] text-center mb-2">
            {isSignUp ? 'Join the kitchen' : 'Welcome back'}
          </h2>
          <p className="text-[var(--muted)] text-center text-sm mb-6">
            {isSignUp 
              ? "Let's get your pantry organized" 
              : "Olive's been keeping things tidy"}
          </p>
          {thenConnect && (
            <div className="bg-[var(--olive-100)] text-[var(--muted-foreground)] text-xs rounded-xl p-3 mb-4">
              Sign in, then we&apos;ll take you straight to connect Kroger.
            </div>
          )}
          <SignInWithGoogle
            onError={setError}
            redirectTo={thenConnect ? '/dashboard?connectKroger=1' : '/dashboard'}
            className="mb-4"
          />

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--card)] px-2 text-[var(--muted)]">or with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--muted-foreground)] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--input)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[#9caf88] focus:border-transparent outline-none transition"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--muted-foreground)] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--input)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[#9caf88] focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-[var(--olive-100)] text-[var(--muted-foreground)] p-3 rounded-xl text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--sage)] text-white py-3.5 rounded-xl hover:bg-[var(--sage-advice)] transition disabled:opacity-50 font-medium"
            >
              {loading ? 'One moment...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[var(--muted)] hover:text-[var(--sage-advice)] text-sm"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "New here? Create an account"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-[var(--border)] text-center">
            <Link
              href="/login?then=connect"
              className="inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--cast-iron)] text-sm"
            >
              <span>🛒</span>
              <span>Continue with Kroger</span>
              <span className="text-[var(--muted)] text-xs">(sign in first)</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[var(--background)] flex items-center justify-center">
          <div className="w-12 h-12 bg-[var(--sage)] rounded-full olive-pulse flex items-center justify-center">
            <span className="text-white text-xl">🫒</span>
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
