# ClimaGuard AI Chat Setup Guide

## Overview

The ClimaGuard AI + Ocean Health Assistant is a complete chatbot implementation that provides intelligent responses about:
- Climate & weather risks (cyclones, floods, heatwaves)
- Disaster preparedness & emergency tips
- Ocean health (coral reefs, water quality, pollution, marine species, sustainability practices)

## Architecture

### Backend
- **API Route**: `/api/chat` (Next.js API route)
- **Location**: `apps/web/src/app/api/chat/route.ts`
- **Features**:
  - Accepts `{ message, userId, history }`
  - Supports OpenAI API integration
  - Fallback to rule-based responses if no API key
  - Maintains conversation history (in-memory, last 20 messages)

### Web Frontend
- **Page**: `/chat`
- **Components**:
  - `ChatWindow.tsx` - Main chat container
  - `MessageBubble.tsx` - Individual message display
  - `ChatInput.tsx` - Message input with send button
- **Location**: `apps/web/src/app/chat/page.tsx`

### Mobile Frontend
- **Screen**: `ChatScreen.tsx`
- **Location**: `apps/mobile/screens/ChatScreen.tsx`
- **Features**: Full chat interface with keyboard handling

## Environment Variables

Create a `.env.local` file in `apps/web/` with:

```env
# Optional: OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
```

**Note**: If `OPENAI_API_KEY` is not provided, the chat will use a rule-based fallback system that still provides helpful responses.

## Running the Chatbot

### Web App
```bash
cd apps/web
npm run dev
```

Then navigate to: `http://localhost:3000/chat`

### Mobile App
```bash
cd apps/mobile
npm start
```

Then press the "💬 AI Chat Assistant" button in the app.

## Navigation

### Web
- Home page: Chat card added to navigation grid
- Dashboard: "AI Chat" tab in navigation bar
- Direct URL: `/chat`

### Mobile
- Main screen: "💬 AI Chat Assistant" button
- Back button: Returns to main screen

## Features

1. **Conversation History**: Maintains context across messages
2. **Error Handling**: Graceful fallback on API errors
3. **Loading States**: Visual feedback during API calls
4. **Responsive Design**: Works on desktop and mobile
5. **Dark Mode Support**: Adapts to theme settings
6. **Accessibility**: Keyboard navigation and screen reader friendly

## API Integration

### OpenAI (Recommended)
1. Get API key from https://platform.openai.com/
2. Add to `.env.local`: `OPENAI_API_KEY=sk-...`
3. Restart dev server

### Fallback Mode
If no API key is provided, the system uses intelligent rule-based responses for:
- Cyclone information
- Flood preparedness
- Coral reef health
- Ocean health
- Disaster preparedness
- Heatwave safety

## Customization

### System Prompt
Edit: `apps/web/src/lib/ai/agentPrompt.ts`

### API Endpoint
The chat API is at: `POST /api/chat`

Request body:
```json
{
  "message": "What should I do during a cyclone?",
  "userId": "user-123",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help?" }
  ]
}
```

Response:
```json
{
  "reply": "During a cyclone...",
  "timestamp": "2024-01-01T12:00:00Z",
  "history": [...]
}
```

## Troubleshooting

1. **Chat not loading**: Check browser console for errors
2. **API errors**: Verify `.env.local` has correct API key
3. **Mobile not connecting**: Update `API_BASE_URL` in `ChatScreen.tsx` to match your server
4. **No responses**: Check network tab for API call status

## Next Steps

- [ ] Add database persistence for chat history
- [ ] Implement user authentication
- [ ] Add streaming responses for better UX
- [ ] Integrate with ClimaGuard data APIs for real-time information
- [ ] Add voice input/output
- [ ] Implement multi-language support

