'use client';

import ChatWindow from '@/components/chat/ChatWindow';
import { PageHeader } from '@/components/ui';
import Link from 'next/link';
import { Button } from '@/components/ui';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-theme" style={{ background: 'linear-gradient(to bottom right, var(--background-secondary), var(--background))' }}>
      <PageHeader 
        title="🌡️ ClimaWise" 
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
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            For real-time data and alerts, visit the{' '}
            <Link 
              href="/dashboard" 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              Dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
