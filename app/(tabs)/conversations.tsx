import React, { useEffect, useState, useCallback } from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import { View, Text, ScrollView, Pressable } from '../../components/ui';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  getConversations,
  deleteConversation,
  generateConversationId,
  type Conversation,
} from '../../lib/chat/history';

// --------------- Helpers ---------------

const formatTimestamp = (ms: number): string => {
  const date = new Date(ms);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const truncatePreview = (text: string | undefined, maxLen = 80): string => {
  if (!text) return 'No messages yet';
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}...`;
};

// --------------- Components ---------------

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center py-32 px-8">
      <Text className="text-3xl mb-3">{'\uD83D\uDCAC'}</Text>
      <Text className="text-lg font-bold text-text mb-2">No conversations</Text>
      <Text className="text-sm text-text-muted text-center leading-5">
        Start a new chat to ask about your health, habits, or goals.
      </Text>
    </View>
  );
}

function ConversationRow({
  conversation,
  onPress,
  onDelete,
}: {
  conversation: Conversation;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable
      className="flex-row items-center px-5 py-4 border-b border-border active:bg-surface-alt"
      onPress={onPress}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
          'Delete Conversation',
          `Delete "${conversation.title}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: onDelete },
          ],
        );
      }}
    >
      <View className="flex-1 mr-3">
        <Text className="text-base font-medium text-text" numberOfLines={1}>
          {conversation.title}
        </Text>
        <Text className="text-sm text-text-muted mt-1" numberOfLines={1}>
          {truncatePreview(conversation.lastMessagePreview)}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-xs text-text-dim">
          {formatTimestamp(conversation.updatedAt)}
        </Text>
      </View>
    </Pressable>
  );
}

// --------------- Screen ---------------

export default function ConversationsScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const list = await getConversations(100);
      setConversations(list);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleNewChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const id = generateConversationId();
    router.push({ pathname: '/(tabs)/chat', params: { conversationId: id } });
  };

  const handleOpenConversation = (conversation: Conversation) => {
    router.push({
      pathname: '/(tabs)/chat',
      params: { conversationId: conversation.id },
    });
  };

  const handleDelete = async (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="pt-16 pb-3 px-6 border-b border-border flex-row items-center justify-between">
        <Text className="text-xl font-bold text-text">Conversations</Text>
        <Pressable
          className="bg-accent rounded-full px-4 py-2 active:opacity-80"
          onPress={handleNewChat}
        >
          <Text className="text-white text-sm font-bold">+ New Chat</Text>
        </Pressable>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF3B30" />
        </View>
      ) : conversations.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView className="flex-1">
          {conversations.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              onPress={() => handleOpenConversation(conversation)}
              onDelete={() => handleDelete(conversation.id)}
            />
          ))}
          <View className="py-6 items-center">
            <Text className="text-xs text-text-dim">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
