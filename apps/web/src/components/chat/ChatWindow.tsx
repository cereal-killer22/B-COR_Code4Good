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

  // Auto-scroll to bottom when new messages arrive (respects reduced motion)
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
      content: `Hello! I'm **ClimaWise** 🌡️, your intelligent Climate Risk & Ocean Health Assistant.

I'm here to help you with:
• 🌪️ **Cyclones** - Formation, tracking, safety, and preparedness
• 🌊 **Floods** - Risk assessment, early warning, and safety measures
• 🌊 **Ocean Health** - Coral reefs, water quality, pollution, marine species
• 🚨 **Disaster Preparedness** - Emergency tips and safety guidance

What would you like to know? Feel free to ask me anything!`,
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

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Get conversation history
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
      content: `Hello! I'm **ClimaWise** 🌡️, your intelligent Climate Risk & Ocean Health Assistant.

I'm here to help you with:
• 🌪️ **Cyclones** - Formation, tracking, safety, and preparedness
• 🌊 **Floods** - Risk assessment, early warning, and safety measures
• 🌊 **Ocean Health** - Coral reefs, water quality, pollution, marine species
• 🚨 **Disaster Preparedness** - Emergency tips and safety guidance

What would you like to know? Feel free to ask me anything!`,
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
    setError(null);
  };

  const showQuickActions = messages.length <= 1 && !isLoading;

  return (
    <div 
      className="flex flex-col h-[750px] max-h-[88vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden backdrop-blur-sm"
      role="main"
      aria-label="ClimaWise chat interface"
    >
      {/* Enhanced Header with Vibrant Colors */}
      <div className="relative bg-gradient-to-r from-cyan-500 via-blue-600 to-emerald-500 p-5 sm:p-6 text-white overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10 motion-safe:animate-pulse">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }}
            aria-hidden="true"
          />
        </div>
        
        <div className="relative flex items-center justify-between z-10">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative group" role="img" aria-label="ClimaWise logo">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/30 backdrop-blur-md flex items-center justify-center text-2xl sm:text-3xl shadow-2xl border-2 border-white/50 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 focus-within:outline-none focus-within:ring-2 focus-within:ring-white focus-within:ring-offset-2">
                🌡️
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-400 rounded-full border-2 sm:border-3 border-white shadow-xl motion-safe:animate-pulse">
                <div className="absolute inset-0 bg-emerald-400 rounded-full motion-safe:animate-ping opacity-75" aria-hidden="true" />
              </div>
            </div>
            <div>
              <h2 className="font-bold text-xl sm:text-2xl tracking-tight mb-1 drop-shadow-md">ClimaWise</h2>
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-300 rounded-full motion-safe:animate-pulse shadow-sm"
                  aria-hidden="true"
                />
                <p className="text-xs sm:text-sm text-cyan-50 font-medium">
                  Online • Cyclone, Flood & Ocean Expert
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleClearChat}
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white/25 hover:bg-white/35 backdrop-blur-md transition-all duration-200 text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 border border-white/40 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-cyan-600"
            title="Clear conversation"
            aria-label="Clear conversation and start fresh"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="hidden sm:inline">Clear</span>
            </span>
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-1 bg-gradient-to-b from-cyan-50/30 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"
        style={{ scrollBehavior: 'smooth' }}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.map((msg, index) => (
          <MessageBubble
            key={`${msg.timestamp}-${index}`}
            message={msg.content}
            isUser={msg.role === 'user'}
            timestamp={msg.timestamp}
          />
        ))}
        
        {/* Quick Actions */}
        {showQuickActions && (
          <div className="mt-6 sm:mt-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
            <QuickActions onActionClick={handleQuickAction} disabled={isLoading} />
          </div>
        )}

        {/* Typing Indicator */}
        {isLoading && <TypingIndicator />}

        {/* Error Message */}
        {error && (
          <div 
            className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 rounded-xl p-4 sm:p-5 text-red-800 dark:text-red-200 text-sm shadow-lg motion-safe:animate-in motion-safe:slide-in-from-left motion-safe:duration-300"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <span className="text-xl">⚠️</span>
              </div>
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
