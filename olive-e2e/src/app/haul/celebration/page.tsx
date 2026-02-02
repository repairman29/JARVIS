'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SageAdviceButton, BentoTile } from '@/components/ui'

export default function FirstHaulCelebrationPage() {
  const [feedback, setFeedback] = useState<'nailed' | 'not_quite' | null>(null)
  const [savings, setSavings] = useState<string | null>(null)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSavings(localStorage.getItem('olive_last_haul_savings'))
    }
  }, [])

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-12 text-[var(--cast-iron)]">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-[var(--basil)] text-white rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg shadow-[#8fbc8f]/20">
          ✓
        </div>

        <h1 className="text-4xl font-serif mb-3">Mission accomplished!</h1>
        <p className="text-[var(--muted-foreground)] text-lg mb-10 leading-relaxed max-w-lg mx-auto">
          Olive is so happy she could help with your first haul. Here&rsquo;s how you did today:
        </p>

        {/* Savings Report */}
        <div className="mb-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-left">
          <h2 className="text-sm uppercase tracking-widest font-semibold text-[var(--sage-advice)] mb-2">Savings Report</h2>
          {savings ? (
            <p className="text-[var(--cast-iron)]">
              Compared to regular prices, Olive saved you <span className="font-semibold text-[var(--basil)]">${savings}</span> on this haul.
            </p>
          ) : (
            <p className="text-[var(--muted-foreground)] text-sm">
              Your savings will appear here after your first haul. Olive tracks coupons and best-value picks so you see exactly how much you saved.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 text-left">
          <BentoTile title="Time Saved">
            <p className="text-sm text-[var(--muted-foreground)]">
              You spent <span className="font-semibold text-[var(--cast-iron)]">12 minutes</span> in the kitchen instead of the app.
            </p>
          </BentoTile>
          <BentoTile title="Savings Found">
            <p className="text-sm text-[var(--muted-foreground)]">
              Olive clipped coupons and saved you <span className="font-semibold text-[var(--cast-iron)]">${savings || '4.50'}</span>.
            </p>
          </BentoTile>
          <BentoTile title="Fuel Points">
            <p className="text-sm text-[var(--muted-foreground)]">
              You&rsquo;re <span className="font-semibold text-[var(--cast-iron)]">150 points</span> closer to your next discount.
            </p>
          </BentoTile>
        </div>

        <div className="bg-[var(--card)] rounded-3xl p-8 border border-[var(--border)] shadow-sm mb-10">
          <h3 className="text-lg font-serif mb-4">The Mentor Feedback Loop</h3>
          <p className="text-[var(--muted-foreground)] mb-6">
            &ldquo;I&rsquo;m still learning your kitchen&rsquo;s rhythm. Did I get your brands right today?&rdquo;
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              className={`px-8 py-3 rounded-xl font-medium transition ${
                feedback === 'nailed' 
                  ? 'bg-[var(--basil)] text-white' 
                  : 'bg-[var(--input)] text-[var(--cast-iron)] hover:bg-[var(--olive-100)]'
              }`}
              onClick={() => setFeedback('nailed')}
            >
              Nailed it!
            </button>
            <button 
              className={`px-8 py-3 rounded-xl font-medium border border-[var(--border)] transition ${
                feedback === 'not_quite' 
                  ? 'bg-[var(--background)] text-[var(--cast-iron)]' 
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--input)]'
              }`}
              onClick={() => setFeedback('not_quite')}
            >
              Not quite
            </button>
          </div>
          
          {feedback === 'nailed' && (
            <p className="mt-4 text-sm text-[var(--sage-advice)] fade-in">
              Perfect. I&rsquo;ve noted those as your favorites. We&rsquo;re getting good at this!
            </p>
          )}
        </div>

        <div className="max-w-md mx-auto">
          <p className="text-[var(--muted-foreground)] mb-6 leading-relaxed">
            Planning another meal soon? Paste a recipe link whenever you&rsquo;re ready, and I&rsquo;ll have your list waiting.
          </p>
          <Link href="/dashboard">
            <SageAdviceButton className="w-full py-4 text-lg">
              Back to My Kitchen
            </SageAdviceButton>
          </Link>
        </div>
      </div>
    </main>
  )
}
