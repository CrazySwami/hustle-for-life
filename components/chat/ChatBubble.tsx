import React from 'react';
import { View, Text } from '../ui';
import type { UIMessage } from 'ai';

interface ChatBubbleProps {
  message: UIMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View
      className={`mb-3 flex-row ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <View
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-accent rounded-br-sm'
            : 'bg-surface rounded-bl-sm'
        }`}
      >
        {message.parts.map((part, i) => {
          if (part.type === 'text') {
            return (
              <Text
                key={`${message.id}-${i}`}
                className={`text-base leading-6 ${
                  isUser ? 'text-white' : 'text-text'
                }`}
              >
                {part.text}
              </Text>
            );
          }
          return null;
        })}
      </View>
    </View>
  );
}
