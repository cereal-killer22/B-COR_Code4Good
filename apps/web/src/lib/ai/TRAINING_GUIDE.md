# ClimaWise Training Guide

## Overview

This guide provides instructions for training and configuring ClimaWise to deliver concise, conversational responses focused on climate risks and ocean health.

## Training Objectives

1. **Conciseness**: Responses limited to 2-3 sentences maximum
2. **Conversational Flow**: Natural back-and-forth, maintains context
3. **Domain Focus**: Expertise in cyclones, floods, and ocean health

## System Prompt Configuration

The system prompt is located in `apps/web/src/lib/ai/agentPrompt.ts`. Key elements:

- **Response Length**: Explicitly limited to 2-3 sentences
- **Tone**: Friendly, conversational, like talking to a knowledgeable friend
- **Context Awareness**: Maintains conversation history
- **Domain Expertise**: Focused on cyclones, floods, ocean health, disaster preparedness

## API Configuration

The chat API (`apps/web/src/app/api/chat/route.ts`) uses these parameters:

```typescript
{
  temperature: 0.7,        // Balanced creativity
  max_tokens: 150,         // Enforces conciseness
  presence_penalty: 0.3,   // Stays on topic
  frequency_penalty: 0.2   // Reduces repetition
}
```

## Example Conversations

### Example 1: Cyclone Questions
```
User: "Is there a cyclone expected this week?"
Bot: "No cyclone is predicted this week, but stay updated with local alerts."

User: "What should I do to prepare?"
Bot: "Stock up on essentials, secure your home, and have an evacuation plan ready. Monitor official weather updates closely."
```

### Example 2: Ocean Health
```
User: "How is the coral reef near Mauritius?"
Bot: "Some areas are stressed due to bleaching, but marine parks are helping protect them."

User: "What causes bleaching?"
Bot: "Bleaching happens when corals get stressed by high water temperatures or pollution. They expel the algae that gives them color and nutrients."
```

### Example 3: Flood Safety
```
User: "What should I do if a flood occurs?"
Bot: "Move to higher ground immediately and follow local emergency instructions."

User: "How can I prepare beforehand?"
Bot: "Know your area's flood risk and have an evacuation plan ready. Keep important documents in waterproof containers."
```

## Training Data Format

Training examples are stored in `apps/web/src/lib/ai/trainingExamples.ts`:

```typescript
{
  user: "Question text",
  assistant: "Concise 2-3 sentence response",
  context?: "Optional context from previous messages"
}
```

## Fine-Tuning Recommendations

### For OpenAI Fine-Tuning:

1. **Prepare Training Data**: Use `QUICK_RESPONSES` and `EXAMPLE_CONVERSATIONS` from `trainingExamples.ts`
2. **Format**: Convert to OpenAI fine-tuning format (JSONL)
3. **Training Steps**: Start with 100-200 examples, evaluate, then expand
4. **Validation**: Test with unseen queries to ensure conciseness

### Example Fine-Tuning Format:

```jsonl
{"messages": [{"role": "system", "content": "You are ClimaWise..."}, {"role": "user", "content": "Is there a cyclone expected?"}, {"role": "assistant", "content": "No cyclone is predicted this week, but stay updated with local alerts."}]}
```

## Testing Checklist

- [ ] Responses are 2-3 sentences maximum
- [ ] Language is simple and clear
- [ ] Context is maintained across multiple turns
- [ ] Tone is friendly and helpful
- [ ] Technical jargon is avoided unless requested
- [ ] Official sources are referenced when appropriate

## Maintaining Conversation Flow

The API maintains conversation history (last 20 messages) to enable context-aware responses. The system prompt emphasizes:

- Remembering previous questions
- Following up on clarifications
- Maintaining natural conversation flow
- Building on earlier topics

## Fallback Responses

When OpenAI API is unavailable, the fallback model (`callLocalModel`) provides concise responses matching the training style. All fallback responses follow the 2-3 sentence format.

## Monitoring & Iteration

1. **Review User Interactions**: Check actual conversations for response length
2. **Adjust Prompt**: Refine system prompt based on observed behavior
3. **Update Examples**: Add new training examples for common queries
4. **Fine-Tune Model**: Use collected conversations for fine-tuning

## Best Practices

1. **Keep It Simple**: Avoid complex explanations unless asked
2. **Stay Focused**: Don't drift into unrelated topics
3. **Be Helpful**: Always provide actionable information
4. **Reference Sources**: Direct users to official sources when appropriate
5. **Maintain Context**: Remember what was discussed earlier in the conversation

