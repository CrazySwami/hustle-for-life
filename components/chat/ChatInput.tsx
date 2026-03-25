import React, { useState, useCallback } from 'react';
import { View, TextInput, Pressable, Text } from '../ui';
import * as Haptics from 'expo-haptics';
import {
  startListening,
  stopListening,
  transcribeAudio,
  isRecording as checkIsRecording,
} from '../../lib/chat/voice';
import { generateAPIUrl, API_KEY } from '../../lib/utils/api';

interface ChatInputProps {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  isStreaming: boolean;
}

export function ChatInput({ value, onChange, onSend, isStreaming }: ChatInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const canSend = value.trim().length > 0 && !isStreaming;

  const handleSend = () => {
    if (!canSend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend();
  };

  const handleMicPress = useCallback(async () => {
    if (isTranscribing) return;

    if (isRecording) {
      // Stop recording
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsRecording(false);
      setIsTranscribing(true);

      const { uri, durationMs } = await stopListening();

      if (uri && durationMs > 500) {
        const text = await transcribeAudio(
          uri,
          generateAPIUrl(''),
          API_KEY,
        );
        if (text.trim()) {
          onChange(value ? `${value} ${text}` : text);
        }
      }

      setIsTranscribing(false);
    } else {
      // Start recording
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const started = await startListening();
      if (started) {
        setIsRecording(true);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, [isRecording, isTranscribing, value, onChange]);

  return (
    <View className="flex-row items-end gap-3 px-4 py-3 bg-background border-t border-border">
      <TextInput
        className="flex-1 bg-surface text-text rounded-full px-5 py-3 text-base max-h-32 border border-border"
        placeholder={isRecording ? 'Listening...' : 'Ask anything...'}
        placeholderTextColor={isRecording ? '#FF3B30' : '#555555'}
        value={value}
        onChangeText={onChange}
        multiline
        editable={!isStreaming && !isRecording}
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
      />

      {/* Mic button */}
      <Pressable
        className={`w-10 h-10 rounded-full items-center justify-center ${
          isRecording
            ? 'bg-accent'
            : isTranscribing
            ? 'bg-border'
            : 'bg-surface border border-border'
        }`}
        onPress={handleMicPress}
        disabled={isStreaming || isTranscribing}
      >
        <Text className="text-white text-lg">
          {isRecording ? '\u23F9' : isTranscribing ? '\u2026' : '\uD83C\uDF99'}
        </Text>
      </Pressable>

      {/* Send button */}
      <Pressable
        className={`w-10 h-10 rounded-full items-center justify-center ${
          canSend ? 'bg-accent' : 'bg-border'
        }`}
        onPress={handleSend}
        disabled={!canSend}
      >
        <Text className="text-white text-lg font-bold">{'\u2191'}</Text>
      </Pressable>
    </View>
  );
}
