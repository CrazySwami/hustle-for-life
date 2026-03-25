import React from 'react';
import { View, TextInput, Pressable, Text } from '../ui';
import * as Haptics from 'expo-haptics';

interface ChatInputProps {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  isStreaming: boolean;
}

export function ChatInput({ value, onChange, onSend, isStreaming }: ChatInputProps) {
  const canSend = value.trim().length > 0 && !isStreaming;

  const handleSend = () => {
    if (!canSend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend();
  };

  return (
    <View className="flex-row items-end gap-2 px-4 py-3 bg-surface border-t border-border">
      <TextInput
        className="flex-1 bg-background text-text rounded-2xl px-4 py-3 text-base max-h-32"
        placeholder="Ask anything..."
        placeholderTextColor="#8b949e"
        value={value}
        onChangeText={onChange}
        multiline
        editable={!isStreaming}
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
      />
      <Pressable
        className={`w-10 h-10 rounded-full items-center justify-center ${
          canSend ? 'bg-accent' : 'bg-border'
        }`}
        onPress={handleSend}
        disabled={!canSend}
      >
        <Text className="text-white text-lg font-bold">↑</Text>
      </Pressable>
    </View>
  );
}
