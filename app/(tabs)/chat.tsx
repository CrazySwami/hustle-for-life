import React, { useRef, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView as RNScrollView,
} from 'react-native';
import { View, Text } from '../../components/ui';
import { ChatBubble } from '../../components/chat/ChatBubble';
import { ChatInput } from '../../components/chat/ChatInput';
import { generateAPIUrl, API_KEY } from '../../lib/utils/api';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { fetch as expoFetch } from 'expo/fetch';

export default function ChatScreen() {
  const [input, setInput] = useState('');
  const scrollViewRef = useRef<RNScrollView>(null);

  const { messages, error, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      fetch: expoFetch as unknown as typeof globalThis.fetch,
      api: generateAPIUrl('/api/chat'),
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    }),
    onError: (err) => console.error('Chat error:', err),
  });

  const isStreaming = status === 'streaming' || status === 'submitted';

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendMessage({ text });
    setInput('');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="pt-16 pb-3 px-6 border-b border-border">
          <Text className="text-xl font-bold text-text">Chat</Text>
        </View>

        {/* Messages */}
        <RNScrollView
          ref={scrollViewRef}
          style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}
          contentContainerStyle={{ paddingBottom: 16 }}
          keyboardDismissMode="interactive"
        >
          {messages.length === 0 && (
            <View className="items-center justify-center py-20">
              <Text className="text-4xl mb-4">💬</Text>
              <Text className="text-text-muted text-lg text-center">
                Ask me anything about your health, habits, or goals.
              </Text>
            </View>
          )}

          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}

          {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
            <View className="flex-row items-center gap-2 mb-3">
              <ActivityIndicator size="small" color="#58a6ff" />
              <Text className="text-text-muted text-sm">Thinking...</Text>
            </View>
          )}
        </RNScrollView>

        {/* Error display */}
        {error && (
          <View className="px-4 py-2 bg-red/20">
            <Text className="text-red text-sm">Error: {error.message}</Text>
          </View>
        )}

        {/* Input */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          isStreaming={isStreaming}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
