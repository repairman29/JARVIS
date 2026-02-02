import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  preload: false, // avoids "preloaded but not used" console warning
});

export const metadata: Metadata = {
  title: 'JARVIS',
  description: 'Developer-grade chat UI for JARVIS — Clawdbot gateway',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={outfit.variable}>
      <body
        data-root
        className={outfit.className}
        style={{
          margin: 0,
          minHeight: '100vh',
          background: 'var(--bg)',
          color: 'var(--text)',
        }}
      >
        {children}
      </body>
    </html>
  );
}
