'use client';

import { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import QuickActions from './QuickActions';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';
    
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: scrollBehavior as ScrollBehavior, block: 'end' });
    }, 100);
  }, [messages, isLoading]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      role: 'assistant',
      content: `Hello! I'm **ClimaWise** 💬, your intelligent Climate Risk & Ocean Health Assistant.

I'm here to help you understand and prepare for climate-related challenges in Mauritius. I can provide detailed information about:

• 🌪️ **Cyclones** - How they form, tracking systems, safety protocols, and comprehensive preparedness strategies
• 🌊 **Floods** - Risk assessment methods, early warning systems, safety measures, and flood management
• 🌊 **Ocean Health** - Coral reef ecosystems, water quality monitoring, pollution impacts, marine biodiversity, and conservation efforts
• 🚨 **Disaster Preparedness** - Emergency planning, safety protocols, evacuation procedures, and staying informed

Whether you need quick safety tips or in-depth explanations, I'm here to help. What would you like to learn about today?`,
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const history = messages.map((msg) => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          userId: 'user',
          history
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      
      // Add 500ms delay before showing the response
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply,
        timestamp: data.timestamp
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or check your connection.',
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (question: string) => {
    handleSendMessage(question);
  };

  const handleClearChat = () => {
    const welcomeMessage: Message = {
      role: 'assistant',
      content: `Hello! I'm **ClimaWise** 💬, your intelligent Climate Risk & Ocean Health Assistant.

I'm here to help you understand and prepare for climate-related challenges in Mauritius. I can provide detailed information about:

• 🌪️ **Cyclones** - How they form, tracking systems, safety protocols, and comprehensive preparedness strategies
• 🌊 **Floods** - Risk assessment methods, early warning systems, safety measures, and flood management
• 🌊 **Ocean Health** - Coral reef ecosystems, water quality monitoring, pollution impacts, marine biodiversity, and conservation efforts
• 🚨 **Disaster Preparedness** - Emergency planning, safety protocols, evacuation procedures, and staying informed

Whether you need quick safety tips or in-depth explanations, I'm here to help. What would you like to learn about today?`,
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
    setError(null);
  };

  const showQuickActions = messages.length <= 1 && !isLoading;

  return (
    <div 
      className="flex flex-col h-[850px] max-h-[90vh] rounded-2xl overflow-hidden"
      style={{
        backgroundColor: 'var(--card-background)',
        border: '1px solid var(--card-border)',
        boxShadow: 'var(--shadow-md)',
      }}
      role="main"
      aria-label="ClimaWise chat interface"
    >
      {/* Minimalist Header */}
      <div 
        className="px-6 py-4 border-b"
        style={{
          borderColor: 'var(--card-border)',
          backgroundColor: 'var(--card-background)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{
                backgroundColor: 'var(--background-secondary)',
              }}
            >
              💬
            </div>
            <div>
              <h2 
                className="text-lg font-semibold"
                style={{ color: 'var(--foreground)' }}
              >
                ClimaWise
              </h2>
              <p 
                className="text-xs"
                style={{ color: 'var(--foreground-secondary)' }}
              >
                Online
              </p>
            </div>
          </div>
          <button
            onClick={handleClearChat}
            className="px-3 py-1.5 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2"
            style={{
              color: 'var(--foreground-secondary)',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--background-secondary)';
              e.currentTarget.style.color = 'var(--foreground)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--foreground-secondary)';
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '2px solid var(--focus-ring)';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
            aria-label="Clear conversation"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-6 py-8 space-y-6"
        style={{ 
          scrollBehavior: 'smooth',
          backgroundColor: 'var(--background-secondary)',
        }}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {messages.map((msg, index) => (
          <MessageBubble
            key={`${msg.timestamp}-${index}`}
            message={msg.content}
            isUser={msg.role === 'user'}
            timestamp={msg.timestamp}
          />
        ))}

        {/* Typing Indicator */}
        {isLoading && <TypingIndicator />}

        {/* Error Message */}
        {error && (
          <div 
            className="px-4 py-3 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--status-error-bg, rgba(239, 68, 68, 0.1))',
              border: '1px solid var(--status-error, #ef4444)',
              color: 'var(--status-error, #dc2626)',
            }}
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Quick Actions - Near Input */}
      {showQuickActions && (
        <div 
          className="px-6 pt-4 pb-2 border-t"
          style={{
            borderColor: 'var(--card-border)',
            backgroundColor: 'var(--card-background)',
          }}
        >
          <QuickActions onActionClick={handleQuickAction} disabled={isLoading} />
        </div>
      )}

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
