'use client';

import ChatWindow from '@/components/chat/ChatWindow';
import { PageHeader } from '@/components/ui';
import Link from 'next/link';
import { Button } from '@/components/ui';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-theme" style={{ background: 'linear-gradient(to bottom right, var(--background-secondary), var(--background))' }}>
      <PageHeader 
        title="💬 ClimaWise" 
        subtitle="Your intelligent assistant for Cyclones, Floods & Ocean Health"
      >
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            ← Back to Dashboard
          </Button>
        </Link>
      </PageHeader>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ChatWindow />
        </div>

        <div className="mt-8 sm:mt-10 text-center animate-in fade-in duration-700 delay-300">
          <p 
            className="text-sm font-medium"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            For real-time data and alerts, visit the{' '}
            <Link 
              href="/dashboard" 
              className="font-bold hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 rounded"
              style={{
                color: 'var(--primary, #3b82f6)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--hover-color, var(--primary, #2563eb))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--primary, #3b82f6)';
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = '2px solid var(--focus-ring, var(--primary, #3b82f6))';
                e.currentTarget.style.outlineOffset = '2px';
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              Dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
