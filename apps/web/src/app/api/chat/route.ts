/**
 * Chat API Route
 * Handles AI chatbot conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { CLIMAGUARD_AI_PROMPT, getChatContext } from '@/lib/ai/agentPrompt';
import { retrieveRelevantData, formatDataAsContext } from '@/lib/services/supabaseDataRetrieval';

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

    // Retrieve relevant data from Supabase knowledge base
    let knowledgeBaseContext = '';
    try {
      const relevantData = await retrieveRelevantData(message, 3); // Get top 3 relevant items
      if (relevantData.length > 0) {
        knowledgeBaseContext = formatDataAsContext(relevantData);
      }
    } catch (error) {
      console.error('Error retrieving knowledge base data:', error);
      // Continue without knowledge base context if retrieval fails
    }

    // Call LLM with knowledge base context
    const reply = await callLLM(message, conversationHistory, knowledgeBaseContext);

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
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  knowledgeBaseContext: string = ''
): Promise<string> {
  // Try Google Gemini first
  const geminiApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (geminiApiKey && geminiApiKey.length > 0) {
    try {
      return await callGemini(message, history, geminiApiKey, knowledgeBaseContext);
    } catch (error) {
      console.error('Gemini API error, falling back to local model:', error);
      // Fall through to local model
    }
  }

  // Try OpenAI as fallback
  const openAiApiKey = process.env.OPENAI_API_KEY;
  if (openAiApiKey && openAiApiKey.length > 0) {
    try {
      return await callOpenAI(message, history, knowledgeBaseContext);
    } catch (error) {
      console.error('OpenAI API error, falling back to local model:', error);
      // Fall through to local model
    }
  }

  // Fallback: Use local model or simple response
  return await callLocalModel(message, history, knowledgeBaseContext);
}

/**
 * Call Google Gemini API
 */
async function callGemini(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  apiKey: string,
  knowledgeBaseContext: string = ''
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
          parts: [{ text: CLIMAGUARD_AI_PROMPT + (knowledgeBaseContext ? '\n\n' + knowledgeBaseContext : '') }]
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
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  knowledgeBaseContext: string = ''
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Build messages array
  const messages = [
    { role: 'system' as const, content: CLIMAGUARD_AI_PROMPT + (knowledgeBaseContext ? '\n\n' + knowledgeBaseContext : '') },
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
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  knowledgeBaseContext: string = ''
): Promise<string> {
  const lowerMessage = message.toLowerCase();

  // Detect yes/no questions
  const isYesNoQuestion = /^(is|are|can|do|does|did|will|would|should|has|have|was|were|may|might)\s/i.test(message.trim());

  // Rule-based responses for common queries (CONCISE - 2-3 sentences max with follow-up questions)
  if (lowerMessage.includes('cyclone') || lowerMessage.includes('hurricane')) {
    if (isYesNoQuestion && (lowerMessage.includes('can') || lowerMessage.includes('form') || lowerMessage.includes('happen'))) {
      return "Yes, cyclones can form near Mauritius during the cyclone season from November to May, when ocean temperatures are warm enough. The island is in the Indian Ocean cyclone basin, so it's important to stay prepared. Would you like to know the warning signs to watch for?";
    }
    if (lowerMessage.includes('expected') || lowerMessage.includes('coming') || lowerMessage.includes('this week')) {
      return "No, there's no cyclone predicted this week, but stay updated with local alerts from Mauritius Meteorological Services, especially during cyclone season (November to May). Would you like to know how to prepare an emergency kit in case a warning is issued?";
    }
    if (lowerMessage.includes('prepare') || lowerMessage.includes('what should i do')) {
      return "Stock up on essentials, secure your home, and have an evacuation plan ready. Monitor official weather updates closely. What specific aspect of cyclone preparedness would you like to learn more about?";
    }
    return "Cyclones are powerful tropical storms that form over warm ocean waters. For current alerts, check Mauritius Meteorological Services or the ClimaGuard dashboard. Would you like to know the warning signs to watch for?";
  }

  if (lowerMessage.includes('flood') || lowerMessage.includes('inundation')) {
    if (lowerMessage.includes('what should i do') || lowerMessage.includes('during') || lowerMessage.includes('happening')) {
      return "Move to higher ground immediately and follow local emergency instructions. Avoid walking or driving through floodwaters, as even shallow water can be dangerous. Do you have an evacuation plan ready?";
    }
    if (lowerMessage.includes('prepare') || lowerMessage.includes('how to')) {
      return "Know your area's flood risk and have an evacuation plan ready. Keep important documents in waterproof containers. Would you like to know more about flood warning systems?";
    }
    return "Floods can occur during heavy rainfall or cyclones. Use ClimaGuard's FloodSense for real-time predictions and check MoESDDBM for official warnings. Are you interested in learning about flood safety measures?";
  }

  if (lowerMessage.includes('coral') || lowerMessage.includes('reef') || lowerMessage.includes('bleaching')) {
    if (lowerMessage.includes('how is') || lowerMessage.includes('status') || lowerMessage.includes('health')) {
      return "Some areas are experiencing bleaching due to rising sea temperatures, but marine protected areas and conservation efforts are helping protect reef health. Are you interested in learning specific ways you can help protect coral reefs?";
    }
    if (lowerMessage.includes('protect') || lowerMessage.includes('help')) {
      return "Avoid touching corals, use reef-safe sunscreen, and practice sustainable fishing. Reducing pollution and runoff also helps protect reefs. Would you like to know more about coral reef conservation efforts in Mauritius?";
    }
    return "Coral reefs are vital marine ecosystems. Bleaching occurs when corals are stressed by high temperatures or pollution. Check ClimaGuard's reef health dashboard for predictions. What would you like to know about reef health?";
  }

  if (lowerMessage.includes('ocean') || lowerMessage.includes('marine') || lowerMessage.includes('water quality')) {
    if (isYesNoQuestion && (lowerMessage.includes('safe') || lowerMessage.includes('swim') || lowerMessage.includes('swimming'))) {
      return "Yes, generally the ocean is safe for swimming in Mauritius, but always check current conditions and any posted warnings. Avoid swimming during rough weather or after heavy rainfall when water quality may be affected. Are you planning to visit a specific beach area?";
    }
    if (lowerMessage.includes('pollution') || lowerMessage.includes('contamination')) {
      return "Ocean pollution includes plastic waste, oil spills, and chemical contamination. Check ClimaGuard's pollution detection feature for real-time monitoring. Would you like to learn about ways to reduce ocean pollution?";
    }
    return "Ocean health covers water quality, pollution levels, and marine biodiversity. Check ClimaGuard's Ocean Health dashboard for comprehensive metrics and real-time data. What aspect of ocean health interests you most?";
  }

  if (lowerMessage.includes('preparedness') || lowerMessage.includes('emergency') || lowerMessage.includes('safety')) {
    if (isYesNoQuestion && (lowerMessage.includes('need') || lowerMessage.includes('should') || lowerMessage.includes('important'))) {
      return "Yes, emergency preparedness is very important, especially in Mauritius where cyclones and floods can occur. Having a plan and supplies ready can save lives. Would you like to know what to include in your emergency kit?";
    }
    if (lowerMessage.includes('kit') || lowerMessage.includes('supplies')) {
      return "Prepare an emergency kit with water, non-perishable food, flashlight, batteries, first aid, and important documents. Keep it ready and accessible. Would you like to know how often to check and update your emergency kit?";
    }
    return "Have an evacuation plan ready, stay informed through ClimaGuard alerts and official sources, and always follow guidance from Mauritius Meteorological Services during emergencies. What specific emergency preparedness topic would you like to explore?";
  }

  if (lowerMessage.includes('heatwave') || lowerMessage.includes('heat') || lowerMessage.includes('temperature')) {
    if (isYesNoQuestion && (lowerMessage.includes('dangerous') || lowerMessage.includes('safe'))) {
      return "Yes, extreme heat can be dangerous, especially for vulnerable groups like children and elderly. Stay hydrated, avoid peak sun hours (10 AM - 4 PM), and seek shade when possible. Would you like to know more about protecting yourself during extreme heat?";
    }
    return "Stay hydrated, avoid peak sun hours (10 AM - 4 PM), and wear light clothing. Watch for signs of heat exhaustion like heavy sweating or dizziness. Would you like to know more about protecting yourself during extreme heat?";
  }

  // Handle generic yes/no questions
  if (isYesNoQuestion) {
    return "I'd be happy to help! Could you provide more details about what you're asking? I can assist with cyclone information, flood safety, ocean health, and emergency preparedness. What specific topic would you like to know more about?";
  }

  // Default response (concise with follow-up)
  return "I'm ClimaWise, your assistant for cyclones, floods, and ocean health. What would you like to know? I can help with safety tips, current risks, or ocean health information. What topic interests you most?";
}

