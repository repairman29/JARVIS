import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en" suppressHydrationWarning>
      <body
        data-root
        style={{
          margin: 0,
          minHeight: '100vh',
          background: '#0f0f12',
          color: '#e4e4e7',
        }}
      >
        {children}
      </body>
    </html>
  );
}
