import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const { width } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { id: 'cyclone', label: 'Cyclone Safety', icon: '🌀', question: 'What should I do during a cyclone?' },
  { id: 'flood', label: 'Flood Prep', icon: '🌊', question: 'How can I prepare for floods?' },
  { id: 'emergency', label: 'Emergency Tips', icon: '🚨', question: 'What emergency tips should I know?' },
  { id: 'coral', label: 'Coral Reef', icon: '🪸', question: 'Tell me about coral reef health' },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isLoading]);

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputText.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!messageText) setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      const history = messages.map((msg) => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage.content,
          userId: 'mobile-user',
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
        content: 'I apologize, but I encountered an error. Please check your connection and try again.',
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear the conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
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
          }
        }
      ]
    );
  };

  const showQuickActions = messages.length <= 1 && !isLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar style="auto" />
      
      {/* Enhanced Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <View style={styles.headerIcon}>
                <Text style={styles.headerIconText}>🌡️</Text>
              </View>
              <View style={styles.statusIndicator} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>ClimaWise</Text>
              <Text style={styles.headerSubtitle}>Online • Climate & Ocean Expert</Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={handleClearChat} 
            style={styles.clearButton}
            accessibilityLabel="Clear conversation"
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg, index) => (
          <Animated.View
            key={`${msg.timestamp}-${index}`}
            style={[
              styles.messageWrapper,
              msg.role === 'user' ? styles.userMessageWrapper : styles.assistantMessageWrapper,
              { opacity: fadeAnim }
            ]}
          >
            {msg.role === 'assistant' && (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>🌡️</Text>
              </View>
            )}
            <View
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.assistantBubble
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  msg.role === 'user' ? styles.userMessageText : styles.assistantMessageText
                ]}
              >
                {msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}
              </Text>
              <Text
                style={[
                  styles.timestamp,
                  msg.role === 'user' ? styles.userTimestamp : styles.assistantTimestamp
                ]}
              >
                {formatTime(msg.timestamp)}
              </Text>
            </View>
            {msg.role === 'user' && (
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>👤</Text>
              </View>
            )}
          </Animated.View>
        ))}
        
        {/* Quick Actions */}
        {showQuickActions && (
          <Animated.View style={[styles.quickActionsContainer, { opacity: fadeAnim }]}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.quickActionButton}
                  onPress={() => handleSendMessage(action.question)}
                  accessibilityLabel={`Ask about ${action.label}`}
                >
                  <Text style={styles.quickActionIcon}>{action.icon}</Text>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Typing Indicator */}
        {isLoading && (
          <View style={styles.loadingWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>🌡️</Text>
            </View>
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <View style={styles.loadingDots}>
                <View style={[styles.dot, styles.dot1]} />
                <View style={[styles.dot, styles.dot2]} />
                <View style={[styles.dot, styles.dot3]} />
              </View>
              <Text style={styles.loadingText}>ClimaWise is thinking...</Text>
            </View>
          </View>
        )}

        {error && (
          <View style={styles.errorWrapper}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Enhanced Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={(text) => text.length <= 500 && setInputText(text)}
            placeholder="Ask ClimaWise about cyclones, floods, ocean health..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            editable={!isLoading}
            accessibilityLabel="Type your message"
          />
          {inputText.length > 0 && (
            <View style={styles.charCount}>
              <Text style={styles.charCountText}>{inputText.length}/500</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isLoading) && styles.sendButtonDisabled
          ]}
          onPress={() => handleSendMessage()}
          disabled={!inputText.trim() || isLoading}
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: !inputText.trim() || isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  headerGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'linear-gradient(to right, #2563EB, #10B981)'
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerIconContainer: {
    position: 'relative',
    marginRight: 12
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  headerIconText: {
    fontSize: 22
  },
  statusIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  headerText: {
    flex: 1
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500'
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6'
  },
  clearButtonText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600'
  },
  messagesContainer: {
    flex: 1
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8
  },
  messageWrapper: {
    marginBottom: 16,
    maxWidth: width * 0.8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse'
  },
  assistantMessageWrapper: {
    alignSelf: 'flex-start'
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4
  },
  avatarText: {
    fontSize: 16
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4
  },
  userAvatarText: {
    fontSize: 16
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  userBubble: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22
  },
  userMessageText: {
    color: '#FFFFFF',
    fontWeight: '400'
  },
  assistantMessageText: {
    color: '#1F2937',
    fontWeight: '400'
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500'
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)'
  },
  assistantTimestamp: {
    color: '#6B7280'
  },
  quickActionsContainer: {
    marginTop: 16,
    marginBottom: 8
  },
  quickActionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center'
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  quickActionButton: {
    flex: 1,
    minWidth: width * 0.4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center'
  },
  loadingWrapper: {
    marginBottom: 16,
    alignSelf: 'flex-start',
    maxWidth: width * 0.8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6B7280'
  },
  dot1: {
    backgroundColor: '#2563EB'
  },
  dot2: {
    backgroundColor: '#10B981'
  },
  dot3: {
    backgroundColor: '#2563EB'
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic'
  },
  errorWrapper: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444'
  },
  errorIcon: {
    fontSize: 20
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
    flex: 1
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5
  },
  inputWrapper: {
    flex: 1,
    position: 'relative'
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 60,
    fontSize: 15,
    maxHeight: 100,
    backgroundColor: '#F9FAFB',
    color: '#1F2937'
  },
  charCount: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  charCountText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600'
  },
  sendButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
    shadowOpacity: 0
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  }
});
