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
      className="flex flex-col h-[750px] max-h-[88vh] bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      role="main"
      aria-label="ClimaWise chat interface"
    >
      {/* Minimalist Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl">
              💬
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">ClimaWise</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
            </div>
          </div>
          <button
            onClick={handleClearChat}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700"
            aria-label="Clear conversation"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-6 py-8 space-y-6 bg-gray-50 dark:bg-gray-950"
        style={{ scrollBehavior: 'smooth' }}
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
        
        {/* Quick Actions */}
        {showQuickActions && (
          <div className="mt-8">
            <QuickActions onActionClick={handleQuickAction} disabled={isLoading} />
          </div>
        )}

        {/* Typing Indicator */}
        {isLoading && <TypingIndicator />}

        {/* Error Message */}
        {error && (
          <div 
            className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
