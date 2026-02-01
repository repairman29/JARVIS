'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function AIUsagePage() {
  const { data: session } = useSession();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchUsage();
    }
  }, [session]);

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/ai/track-usage');
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Failed to fetch AI usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = () => {
    if (usage?.apiKey) {
      navigator.clipboard.writeText(usage.apiKey);
      alert('API key copied to clipboard!');
    }
  };

  if (!session) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>AI Usage & API Keys</h1>
        <p>Please sign in to view your AI usage and manage API keys.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>AI Usage & API Keys</h1>
        <p>Loading...</p>
      </div>
    );
  }

  const resetDate = usage?.resetAt ? new Date(usage.resetAt).toLocaleDateString() : 'Unknown';
  const tierEmoji = usage?.tier === 'pro' ? '🚀' : usage?.tier === 'team' ? '🧠' : '🆓';
  const progressPercentage = usage ? (usage.usage / usage.limit) * 100 : 0;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h1>🤖 AI Usage & API Keys</h1>
      
      {usage && (
        <div>
          <div style={{ 
            background: '#f8f9fa', 
            padding: '1.5rem', 
            borderRadius: '8px', 
            marginBottom: '2rem',
            border: '1px solid #e9ecef'
          }}>
            <h2>{tierEmoji} {usage.tier.charAt(0).toUpperCase() + usage.tier.slice(1)} Plan</h2>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Usage this month:</strong> {usage.usage} / {usage.limit} AI queries
            </div>
            
            <div style={{
              background: '#e9ecef',
              height: '20px',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '1rem'
            }}>
              <div style={{
                background: progressPercentage > 80 ? '#dc3545' : progressPercentage > 60 ? '#ffc107' : '#28a745',
                height: '100%',
                width: `${Math.min(progressPercentage, 100)}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
            
            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
              <strong>Remaining:</strong> {usage.remaining} queries | <strong>Resets:</strong> {resetDate}
            </div>
          </div>

          <div style={{
            background: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            border: '1px solid #e9ecef'
          }}>
            <h3>🔑 Your API Key</h3>
            <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
              Use this key to access AI features in JARVIS and future ML integrations:
            </p>
            <div style={{
              background: '#1a1a1a',
              padding: '1rem',
              borderRadius: '4px',
              fontFamily: 'monospace',
              color: '#f8f9fa',
              marginBottom: '1rem',
              wordBreak: 'break-all'
            }}>
              {usage.apiKey}
            </div>
            <button
              onClick={copyApiKey}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Copy API Key
            </button>
          </div>

          <div style={{
            background: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            border: '1px solid #e9ecef'
          }}>
            <h3>⚙️ Setup Instructions</h3>
            <p><strong>Environment Variable:</strong></p>
            <div style={{
              background: '#1a1a1a',
              padding: '1rem',
              borderRadius: '4px',
              fontFamily: 'monospace',
              color: '#f8f9fa',
              marginBottom: '1rem'
            }}>
              export UPSHIFTAI_API_KEY={usage.apiKey}
            </div>
            
            <p><strong>JARVIS Usage:</strong></p>
            <div style={{
              background: '#1a1a1a',
              padding: '1rem',
              borderRadius: '4px',
              fontFamily: 'monospace',
              color: '#f8f9fa',
              fontSize: '0.9rem'
            }}>
              # Now you can ask JARVIS:<br/>
              "Analyze my dependencies"<br/>
              "Check for ancient packages"<br/>
              "How's my dependency health?"
            </div>
          </div>

          {usage.tier === 'free' && (
            <div style={{
              background: '#fff3cd',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #ffeaa7'
            }}>
              <h3>🚀 Upgrade for More AI Power</h3>
              <p>You're on the Free tier with {usage.limit} AI queries per month.</p>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Pro ($19/mo):</strong> 1,000 AI queries + advanced features<br/>
                <strong>Team ($99/mo):</strong> 10,000 AI queries + custom ML models
              </div>
              <a 
                href="/pricing" 
                style={{
                  background: '#007bff',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  display: 'inline-block'
                }}
              >
                Upgrade Now
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}