/**
 * Chat API Route
 * Handles AI chatbot conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { CLIMAGUARD_AI_PROMPT, getChatContext } from '@/lib/ai/agentPrompt';

// In-memory chat history (in production, use a database)
const chatHistory: Map<string, Array<{ role: 'user' | 'assistant'; content: string }>> = new Map();

interface ChatRequest {
  message: string;
  userId?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, userId = 'anonymous', history = [] } = body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Get or initialize chat history for user
    const userHistory = chatHistory.get(userId) || [];
    
    // Combine provided history with stored history (prefer provided history)
    const conversationHistory = history.length > 0 ? history : userHistory;

    // Call LLM (OpenAI, Claude, or fallback)
    const reply = await callLLM(message, conversationHistory);

    // Update chat history
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user' as const, content: message },
      { role: 'assistant' as const, content: reply }
    ];
    chatHistory.set(userId, updatedHistory.slice(-20)); // Keep last 20 messages

    return NextResponse.json({
      reply,
      timestamp: new Date().toISOString(),
      history: updatedHistory
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      {
        error: 'Failed to process chat message',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Call LLM API (Google Gemini, OpenAI, or fallback)
 */
async function callLLM(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  // Try Google Gemini first
  const geminiApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (geminiApiKey && geminiApiKey.length > 0) {
    try {
      return await callGemini(message, history, geminiApiKey);
    } catch (error) {
      console.error('Gemini API error, falling back to local model:', error);
      // Fall through to local model
    }
  }

  // Try OpenAI as fallback
  const openAiApiKey = process.env.OPENAI_API_KEY;
  if (openAiApiKey && openAiApiKey.length > 0) {
    try {
      return await callOpenAI(message, history);
    } catch (error) {
      console.error('OpenAI API error, falling back to local model:', error);
      // Fall through to local model
    }
  }

  // Fallback: Use local model or simple response
  return await callLocalModel(message, history);
}

/**
 * Call Google Gemini API
 */
async function callGemini(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  apiKey: string
): Promise<string> {
  // Build conversation history for Gemini
  // Gemini uses alternating user/assistant messages in contents array
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  
  // Add conversation history
  for (const msg of history) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  }
  
  // Add current user message
  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  // Use faster model for rapid responses (gemini-1.5-flash is faster than gemini-pro)
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Create AbortController for timeout (5 seconds max)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: CLIMAGUARD_AI_PROMPT }]
        },
        generationConfig: {
          temperature: 0.7, // Balanced for detailed, natural responses
          maxOutputTokens: 300, // Increased for elaborate answers with follow-up questions
          topP: 0.8, // Balanced for quality responses
          topK: 40 // Balanced for diverse vocabulary
        }
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${response.status} ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('No response from Gemini API');
    }

    return text.trim();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }
    throw error;
  }
}

/**
 * Call OpenAI API (fallback)
 */
async function callOpenAI(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Build messages array
  const messages = [
    { role: 'system' as const, content: CLIMAGUARD_AI_PROMPT },
    ...history.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    })),
    { role: 'user' as const, content: message }
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages,
      temperature: 0.7, // Balanced for detailed, natural responses
      max_tokens: 300, // Increased for elaborate answers with follow-up questions
      presence_penalty: 0.3,
      frequency_penalty: 0.2,
      stream: false // Explicitly set to false for faster response
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${response.status} ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
}

/**
 * Fallback: Local model or rule-based response
 */
async function callLocalModel(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const lowerMessage = message.toLowerCase();

  // Rule-based responses for common queries (CONCISE - 2-3 sentences max)
  if (lowerMessage.includes('cyclone') || lowerMessage.includes('hurricane')) {
    if (lowerMessage.includes('expected') || lowerMessage.includes('coming') || lowerMessage.includes('this week')) {
      return "Check the ClimaGuard dashboard for current predictions. Always follow official alerts from Mauritius Meteorological Services.";
    }
    if (lowerMessage.includes('prepare') || lowerMessage.includes('what should i do')) {
      return "Stock up on essentials, secure your home, and have an evacuation plan ready. Monitor official weather updates closely.";
    }
    return "Cyclones are powerful tropical storms that form over warm ocean waters. For current alerts, check Mauritius Meteorological Services or the ClimaGuard dashboard.";
  }

  if (lowerMessage.includes('flood') || lowerMessage.includes('inundation')) {
    if (lowerMessage.includes('what should i do') || lowerMessage.includes('during') || lowerMessage.includes('happening')) {
      return "Move to higher ground immediately and follow local emergency instructions. Avoid walking or driving through floodwaters.";
    }
    if (lowerMessage.includes('prepare') || lowerMessage.includes('how to')) {
      return "Know your area's flood risk and have an evacuation plan ready. Keep important documents in waterproof containers.";
    }
    return "Floods can occur during heavy rainfall or cyclones. Use ClimaGuard's FloodSense for real-time predictions and check MoESDDBM for official warnings.";
  }

  if (lowerMessage.includes('coral') || lowerMessage.includes('reef') || lowerMessage.includes('bleaching')) {
    if (lowerMessage.includes('how is') || lowerMessage.includes('status') || lowerMessage.includes('health')) {
      return "Some areas are stressed due to bleaching, but marine parks are helping protect them. Check the ClimaGuard Ocean Health dashboard for current metrics.";
    }
    if (lowerMessage.includes('protect') || lowerMessage.includes('help')) {
      return "Avoid touching corals, use reef-safe sunscreen, and practice sustainable fishing. Reducing pollution and runoff also helps protect reefs.";
    }
    return "Coral reefs are vital marine ecosystems. Bleaching occurs when corals are stressed by high temperatures or pollution. Check ClimaGuard's reef health dashboard for predictions.";
  }

  if (lowerMessage.includes('ocean') || lowerMessage.includes('marine') || lowerMessage.includes('water quality')) {
    if (lowerMessage.includes('pollution') || lowerMessage.includes('contamination')) {
      return "Ocean pollution includes plastic waste, oil spills, and chemical contamination. Check ClimaGuard's pollution detection feature for real-time monitoring.";
    }
    return "Ocean health covers water quality, pollution levels, and marine biodiversity. Check ClimaGuard's Ocean Health dashboard for comprehensive metrics and real-time data.";
  }

  if (lowerMessage.includes('preparedness') || lowerMessage.includes('emergency') || lowerMessage.includes('safety')) {
    if (lowerMessage.includes('kit') || lowerMessage.includes('supplies')) {
      return "Prepare an emergency kit with water, non-perishable food, flashlight, batteries, first aid, and important documents. Keep it ready and accessible.";
    }
    return "Have an evacuation plan ready, stay informed through ClimaGuard alerts and official sources, and always follow guidance from Mauritius Meteorological Services during emergencies.";
  }

  if (lowerMessage.includes('heatwave') || lowerMessage.includes('heat') || lowerMessage.includes('temperature')) {
    return "Stay hydrated, avoid peak sun hours (10 AM - 4 PM), and wear light clothing. Watch for signs of heat exhaustion like heavy sweating or dizziness.";
  }

  // Default response (concise)
  return "I'm ClimaWise, your assistant for cyclones, floods, and ocean health. What would you like to know? I can help with safety tips, current risks, or ocean health information.";
}

