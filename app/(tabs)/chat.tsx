import React, { useRef, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView as RNScrollView,
  Pressable,
} from 'react-native';
import { View, Text } from '../../components/ui';
import { ChatBubble } from '../../components/chat/ChatBubble';
import { ChatInput } from '../../components/chat/ChatInput';
import { generateAPIUrl, API_KEY } from '../../lib/utils/api';
import { currentScope } from './settings';
import {
  saveConversation,
  saveMessage,
  generateConversationId,
  generateTitle,
  ensureChatDB,
} from '../../lib/chat/history';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { fetch as expoFetch } from 'expo/fetch';

export default function ChatScreen() {
  const [input, setInput] = useState('');
  const scrollViewRef = useRef<RNScrollView>(null);
  const conversationIdRef = useRef(generateConversationId());
  const savedMessageCountRef = useRef(0);
  const conversationCreatedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    ensureChatDB();
  }, []);

  const { messages, error, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      fetch: expoFetch as unknown as typeof globalThis.fetch,
      api: generateAPIUrl('/api/chat'),
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      body: {
        scope: currentScope,
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

  // Persist new messages to local DB
  useEffect(() => {
    const newMessages = messages.slice(savedMessageCountRef.current);
    for (const msg of newMessages) {
      const textContent = msg.parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('');

      if ((msg.role === 'user' || msg.role === 'assistant') && textContent) {
        saveMessage(conversationIdRef.current, msg.role, textContent).catch(
          (err) => console.warn('Failed to save message:', err),
        );
      }
    }
    savedMessageCountRef.current = messages.length;

    // Create conversation record after first user message
    if (!conversationCreatedRef.current && messages.some((m) => m.role === 'user')) {
      conversationCreatedRef.current = true;
      const messagesWithContent = messages.map((m) => ({
        role: m.role,
        content: m.parts
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map((p) => p.text)
          .join(''),
      }));
      const title = generateTitle(messagesWithContent);
      saveConversation(conversationIdRef.current, title).catch((err) =>
        console.warn('Failed to save conversation:', err),
      );
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
        <View className="pt-16 pb-3 px-6 border-b border-border flex-row items-center justify-between">
          <Text className="text-xl font-bold text-text">Chat</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/conversations');
            }}
            hitSlop={8}
          >
            <Text style={{ fontSize: 22 }}>🕐</Text>
          </Pressable>
        </View>

        {/* Messages */}
        <RNScrollView
          ref={scrollViewRef}
          style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}
          contentContainerStyle={{ paddingBottom: 16 }}
          keyboardDismissMode="interactive"
        >
          {messages.length === 0 && (
            <View className="items-center justify-center py-24">
              <Text className="text-text-dim text-lg mb-2 font-bold">No messages yet</Text>
              <Text className="text-text-dim text-sm text-center px-8">
                Ask about your health, habits, or goals.
              </Text>
            </View>
          )}

          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}

          {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
            <View className="flex-row items-center gap-2 mb-3">
              <ActivityIndicator size="small" color="#FF3B30" />
              <Text className="text-text-muted text-sm">Thinking...</Text>
            </View>
          )}
        </RNScrollView>

        {/* Error display */}
        {error && (
          <View className="px-4 py-2 bg-red-dim">
            <Text className="text-accent text-sm">Error: {error.message}</Text>
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
