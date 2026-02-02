'use client';

import { Chat } from '@/components/Chat';

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg, #0f0f12)',
      }}
    >
      <Chat />
    </main>
  );
}
