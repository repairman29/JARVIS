'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SageAdviceButton, BentoTile } from '@/components/ui'

function ConnectSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const storeName = searchParams.get('store') || 'Kroger store'

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-12 text-[var(--cast-iron)]">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8 flex justify-center items-center gap-4">
          <div className="w-16 h-16 bg-[var(--olive-100)] rounded-2xl flex items-center justify-center text-3xl animate-bounce">
            🫒
          </div>
          <div className="text-2xl text-[#87a05a] dark:text-[#a4a999]">🤝</div>
          <div className="w-16 h-16 bg-[var(--olive-100)] rounded-2xl flex items-center justify-center text-3xl">
            🛒
          </div>
        </div>

        <div className="w-12 h-12 rounded-full bg-[#8fbc8f] text-white flex items-center justify-center text-xl mx-auto mb-4">
          ✓
        </div>

        <h1 className="text-3xl font-serif mb-2">You&rsquo;re all set!</h1>
        <p className="text-[var(--muted-foreground)] mb-8 leading-relaxed">
          Olive is now connected to your <span className="font-semibold text-[var(--cast-iron)]">{storeName}</span>. She&rsquo;s ready to start tucking items into your cart.
        </p>

        <div className="grid grid-cols-1 gap-4 mb-10 text-left">
          <BentoTile title="The Magic Paste">
            <p className="text-xs text-[var(--muted-foreground)] mb-4">
              Have a recipe in mind? Paste the link here and I&rsquo;ll find the ingredients.
            </p>
            <SageAdviceButton 
              className="w-full text-xs"
              onClick={() => router.push('/dashboard?action=paste')}
            >
              Paste a Link
            </SageAdviceButton>
          </BentoTile>

          <BentoTile title="The Pantry Staples">
            <p className="text-xs text-[var(--muted-foreground)] mb-4">
              Need the basics? Tap here to add your usual milk, eggs, or bread.
            </p>
            <button 
              className="w-full text-xs py-3 rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] font-medium hover:bg-[var(--input)] transition"
              onClick={() => router.push('/dashboard?action=staples')}
            >
              Quick Add Essentials
            </button>
          </BentoTile>
        </div>

        <div className="bg-[var(--card)] rounded-2xl p-5 border border-[var(--border)] text-left mb-8 shadow-sm">
          <h3 className="text-xs uppercase tracking-widest font-semibold text-[#87a05a] mb-3">
            Security Handshake
          </h3>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
            <span className="font-medium text-[var(--cast-iron)]">Q: Now that I&rsquo;m connected, what can Olive see?</span><br />
            &ldquo;Just enough to be helpful! Olive can see your preferred store and your past purchases so she can suggest your favorite brands. She <span className="font-semibold text-red-700">cannot</span> see your password, your credit card, or place an order without you. You&rsquo;re always the pilot.&rdquo;
          </p>
        </div>

        <p className="text-xs text-[#87a05a] italic">
          Tip: Add Olive to your home screen for one-tap access.
        </p>
      </div>
    </main>
  )
}

export default function ConnectSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConnectSuccessContent />
    </Suspense>
  )
}
