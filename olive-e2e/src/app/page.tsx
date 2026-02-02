'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BentoTile, CommandInput, SageAdviceButton, ThemeToggle } from '@/components/ui'

export default function Home() {
  const [heroCommand, setHeroCommand] = useState('')
  return (
    <main className="min-h-screen bg-[var(--hero-gradient)]">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Nav */}
        <nav className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-10 sm:mb-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--sage-advice)] rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🫒</span>
            </div>
            <span className="text-xl font-medium text-[var(--cast-iron)]">Olive</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <ThemeToggle />
            <span className="hidden sm:inline-flex items-center gap-2 text-[var(--muted)]">
              <span className="w-2 h-2 bg-[var(--basil)] rounded-full"></span>
              Friends & family beta
            </span>
            <Link
              href="/login"
              className="text-[var(--sage-advice)] hover:text-[var(--sage-advice)] transition font-medium"
            >
              Sign In
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <div className="grid lg:grid-cols-2 gap-10 items-center mb-16 sm:mb-20">
          <div>
            <div className="inline-flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] px-3 py-1.5 rounded-full text-[var(--sage-advice)] text-xs mb-6 shadow-sm">
              <span className="w-2 h-2 bg-[var(--basil)] rounded-full"></span>
              Private beta • Invite-only
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[var(--cast-iron)] mb-6 leading-tight">
              Your Kitchen Companion
            </h1>
            <p className="text-base sm:text-lg text-[var(--muted-foreground)] mb-8 leading-relaxed">
              Turn messy lists and recipes into a filled Kroger cart in one tap. Olive finds the right brands,
              clips the deals, and keeps you in control at checkout.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <SageAdviceButton
                className="text-lg px-8 py-4 rounded-full shadow-sm w-full sm:w-auto"
                onClick={() => (window.location.href = '/login')}
              >
                Join the Beta →
              </SageAdviceButton>
            </div>
            <div className="mt-4 sm:mt-3 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-[var(--muted)]">
              <span className="inline-flex items-center gap-2 italic">
                <span className="text-lg">↗</span>
                Help us teach Olive your favorite brands.
              </span>
              <Link
                href="/login?then=connect"
                className="inline-flex items-center gap-2 text-[var(--sage-advice)] hover:text-[var(--sage-advice)] transition"
              >
                <span>🛒</span>
                <span>Continue with Kroger</span>
              </Link>
              <a
                href={`https://${process.env.NEXT_PUBLIC_KROGER_CART_DOMAIN || 'www.kroger.com'}/shopping/cart`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[var(--sage-advice)] hover:text-[var(--sage-advice)] transition"
              >
                View Cart
              </a>
            </div>
            <p className="text-xs text-[var(--muted)] mt-4">
              Add Olive to your home screen for one-tap access • Olive never checks out for you.
            </p>
          </div>

          <BentoTile className="rounded-[28px] sm:rounded-[32px]">
            <div className="bg-[var(--input)] rounded-3xl p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-[var(--sage-advice)] rounded-full flex items-center justify-center olive-pulse">
                  <span className="text-white">🫒</span>
                </div>
                <div>
                  <p className="text-[var(--cast-iron)] font-medium">Olive</p>
                  <p className="text-[var(--muted)] text-xs">Kitchen companion</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="bg-[var(--card)] rounded-2xl px-4 py-3 border border-[var(--border)]">
                  &ldquo;Olive, we need sourdough and green apples.&rdquo;
                </div>
                <div className="bg-[var(--olive-100)] rounded-2xl px-4 py-3 text-[var(--sage-advice)]">
                  Added your usual sourdough. Fuji apples are on sale — want those?
                </div>
                <div className="bg-[var(--card)] rounded-2xl px-4 py-3 border border-[var(--border)]">
                  &ldquo;Yes, perfect.&rdquo;
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 text-center text-xs text-[var(--sage-advice)]">
              <div className="bg-[var(--input)] rounded-2xl py-3">
                <div className="text-lg">🏷️</div>
                Coupons
                <div className="text-[11px] text-[var(--muted)] mt-1">12 deals spotted today</div>
              </div>
              <div className="bg-[var(--input)] rounded-2xl py-3">
                <div className="text-lg">⛽</div>
                Fuel points
                <div className="text-[11px] text-[var(--muted)] mt-1">+30¢ on deck</div>
              </div>
              <div className="bg-[var(--input)] rounded-2xl py-3">
                <div className="text-lg">🛒</div>
                Ready cart
                <div className="text-[11px] text-[var(--muted)] mt-1">Drafted for review</div>
              </div>
            </div>
          </BentoTile>
        </div>

        {/* How it Works - Bento Style */}
        <div className="grid md:grid-cols-2 gap-4 mb-16">
          {/* Main Card */}
          <BentoTile className="md:col-span-2">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-12 h-12 bg-[var(--olive-100)] rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                💬
              </div>
              <div>
                <h3 className="text-xl font-medium text-[var(--cast-iron)] mb-2">Just tell her</h3>
                <p className="text-[var(--muted-foreground)]">
                  Type &ldquo;Olive, we need milk&rdquo; — that&apos;s it. She finds your usual brand,
                  adds it to your cart, and keeps a running list as you go.
                </p>
              </div>
            </div>
          </BentoTile>

          {/* Secondary Cards */}
          <BentoTile>
            <div className="relative w-12 h-12 bg-[var(--olive-100)] rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-sm">
              <span>🏷️</span>
              <span className="absolute -right-1 -bottom-1 text-sm">✂️</span>
            </div>
            <h3 className="text-lg font-medium text-[var(--cast-iron)] mb-1">Coupons Clipped</h3>
            <p className="text-[var(--muted-foreground)] text-sm">
              Olive finds digital deals on items you actually buy and applies them automatically.
            </p>
          </BentoTile>

          <BentoTile>
            <div className="relative w-12 h-12 bg-[var(--olive-100)] rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-sm">
              <span>⛽</span>
              <span className="absolute -right-1 -bottom-1 text-sm">📈</span>
            </div>
            <h3 className="text-lg font-medium text-[var(--cast-iron)] mb-1">Fuel Points Tracked</h3>
            <p className="text-[var(--muted-foreground)] text-sm">
              She&apos;ll let you know when you&apos;re close to the next discount at the pump.
            </p>
          </BentoTile>

          <BentoTile>
            <div className="relative w-12 h-12 bg-[var(--olive-100)] rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-sm">
              <span>🔔</span>
              <span className="absolute -right-1 -bottom-1 text-sm">🕒</span>
            </div>
            <h3 className="text-lg font-medium text-[var(--cast-iron)] mb-1">Never Run Out</h3>
            <p className="text-[var(--muted-foreground)] text-sm">
              Olive remembers your rhythm. She&apos;ll nudge you before the milk carton goes empty.
            </p>
          </BentoTile>

          <BentoTile>
            <div className="w-12 h-12 bg-[var(--olive-100)] rounded-2xl flex items-center justify-center mb-3 shadow-sm">
              <div className="flex items-center gap-1 text-sm">
                <span className="text-base">🏷️</span>
                <div className="relative w-6 h-2 bg-[var(--border)] rounded-full">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[var(--card)] border border-[var(--border)] rounded-full shadow-sm"></span>
                </div>
                <span className="text-base">⭐</span>
              </div>
            </div>
            <h3 className="text-lg font-medium text-[var(--cast-iron)] mb-1">Budget vs. Splurge</h3>
            <p className="text-[var(--muted-foreground)] text-sm">
              Choose savings-first or favorite brands — Olive shifts the cart to match your mood.
            </p>
          </BentoTile>
        </div>

        {/* Aha Demo */}
        <div className="grid md:grid-cols-2 gap-4 mb-16">
          <BentoTile>
            <h3 className="text-[var(--cast-iron)] font-medium mb-2">Before Olive</h3>
            <p className="text-[var(--muted-foreground)] text-sm mb-4">Copying a list item-by-item in the Kroger app.</p>
            <div className="space-y-2 text-sm">
              <div className="bg-[var(--input)] rounded-xl px-3 py-2 border border-[var(--border)]">Milk</div>
              <div className="bg-[var(--input)] rounded-xl px-3 py-2 border border-[var(--border)]">Avocados</div>
              <div className="bg-[var(--input)] rounded-xl px-3 py-2 border border-[var(--border)]">Sourdough</div>
            </div>
          </BentoTile>
          <BentoTile>
            <h3 className="text-[var(--cast-iron)] font-medium mb-2">With Olive</h3>
            <p className="text-[var(--muted-foreground)] text-sm mb-4">Paste once. Olive sorts, finds, and fills.</p>
            <div className="bg-[var(--input)] rounded-2xl px-4 py-3 border border-[var(--border)] text-sm">
              &ldquo;Milk, avocados, sourdough, trash bags&rdquo;
            </div>
            <div className="mt-3 text-xs text-[var(--muted)]">
              &ldquo;I found 4 items. Sound right?&rdquo;
            </div>
          </BentoTile>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {[
            { step: '1', title: 'Connect Kroger', text: 'Link your account once so Olive can build your cart.' },
            { step: '2', title: 'Add as you go', text: 'Drop items in whenever you think of them.' },
            { step: '3', title: 'Checkout anytime', text: 'Review and place the order when it suits you.' },
          ].map((item) => (
            <BentoTile key={item.step}>
              <div className="w-8 h-8 bg-[var(--olive-100)] rounded-full flex items-center justify-center text-sm font-medium text-[var(--muted-foreground)] mb-3">
                {item.step}
              </div>
              <h3 className="text-[var(--cast-iron)] font-medium mb-2">{item.title}</h3>
              <p className="text-[var(--muted-foreground)] text-sm">{item.text}</p>
            </BentoTile>
          ))}
        </div>

        {/* Try it */}
        <div className="mb-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
            <div>
              <h3 className="text-xl font-medium text-[var(--cast-iron)] mb-2">Try the command flow</h3>
              <p className="text-[var(--muted-foreground)] text-sm">
                Drop a list here and see how Olive thinks before you even sign in.
              </p>
            </div>
            <Link
              href="/login?then=connect"
              className="inline-flex items-center gap-2 border border-[var(--border)] text-[var(--muted-foreground)] text-sm px-4 py-2 rounded-full hover:bg-[var(--input)] transition w-fit"
            >
              Continue with Kroger
            </Link>
          </div>
          <CommandInput
            value={heroCommand}
            onChange={setHeroCommand}
            onSubmit={() => (window.location.href = '/login')}
            helperText="We’ll save your list once you connect."
          />
        </div>

        {/* FAQ */}
        <div className="bg-[var(--card)] rounded-3xl p-6 sm:p-8 border border-[var(--border)] shadow-sm mb-12">
          <h3 className="text-xl font-medium text-[var(--cast-iron)] mb-4">Questions</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-[var(--muted-foreground)]">
            <div>
              <p className="font-medium text-[var(--cast-iron)] mb-1">Does Olive place the order?</p>
              <p>No. Olive builds your cart, you review and checkout in Kroger.</p>
            </div>
            <div>
              <p className="font-medium text-[var(--cast-iron)] mb-1">Is this only for Kroger?</p>
              <p>For now, yes. It works across the Kroger family of stores.</p>
            </div>
            <div>
              <p className="font-medium text-[var(--cast-iron)] mb-1">What about substitutions?</p>
              <p>Olive will ask before swapping anything unless you say otherwise.</p>
            </div>
            <div>
              <p className="font-medium text-[var(--cast-iron)] mb-1">Is this free?</p>
              <p>During beta, yes. We just want feedback and real-world use.</p>
            </div>
          </div>
        </div>

        {/* Supported Stores */}
        <div className="text-center py-8 border-t border-[var(--border)]">
          <p className="text-[var(--muted)] text-sm mb-3">Works with the Kroger family</p>
          <div className="flex flex-wrap justify-center gap-6 text-[var(--muted-foreground)] opacity-60">
            <span>Kroger</span>
            <span>King Soopers</span>
            <span>Fry&apos;s</span>
            <span>Ralphs</span>
            <span>Fred Meyer</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-6 bg-[var(--card)]/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center text-[var(--muted)] text-sm">
          <p>Made with care • Olive never places orders for you • Not affiliated with Kroger</p>
        </div>
      </footer>
    </main>
  )
}
