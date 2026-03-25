'use widget';

import { Text, View } from 'react-native';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';
import type { LiveActivityLayout } from 'expo-widgets/src/Widgets.types';

type AIStatusActivityProps = {
  status: 'idle' | 'thinking' | 'responding';
  lastMessage: string;
  model: string;
};

const STATUS_CONFIG = {
  idle: { color: '#34C759', label: 'Ready', icon: '\uD83D\uDFE2' },
  thinking: { color: '#FF9500', label: 'Thinking...', icon: '\uD83E\uDDE0' },
  responding: { color: '#FF3B30', label: 'Responding...', icon: '\u2728' },
} as const;

function abbreviateModel(model: string): string {
  if (model.includes('sonnet')) return 'SNT';
  if (model.includes('opus')) return 'OPS';
  if (model.includes('gpt')) return 'GPT';
  if (model.includes('gemini')) return 'GEM';
  return model.slice(0, 3).toUpperCase();
}

function AIStatusActivityLayout(
  props: AIStatusActivityProps,
  _env: LiveActivityEnvironment,
): LiveActivityLayout {
  const { status, lastMessage, model } = props;
  const config = STATUS_CONFIG[status];
  const truncatedMessage =
    lastMessage.length > 120 ? lastMessage.slice(0, 120) + '...' : lastMessage;

  return {
    banner: (
      <View style={{ flex: 1, backgroundColor: '#000', padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: config.color,
              }}
            />
            <Text style={{ fontSize: 12, fontWeight: '700', color: config.color }}>
              {config.label}
            </Text>
          </View>
          <Text style={{ fontSize: 10, color: '#555', fontWeight: '600' }}>
            {model}
          </Text>
        </View>
        <View style={{ backgroundColor: '#111', borderRadius: 10, padding: 12 }}>
          <Text style={{ fontSize: 13, color: '#ccc', lineHeight: 18 }}>
            {truncatedMessage || 'No messages yet'}
          </Text>
        </View>
      </View>
    ),

    compactLeading: (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 4 }}>
        <Text style={{ fontSize: 12 }}>{config.icon}</Text>
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: config.color,
          }}
        />
      </View>
    ),

    compactTrailing: (
      <View style={{ paddingRight: 4 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#888' }}>
          {abbreviateModel(model)}
        </Text>
      </View>
    ),

    minimal: (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: config.color,
          }}
        />
      </View>
    ),
  };
}

export const aiStatusActivity = createLiveActivity<AIStatusActivityProps>(
  'AIStatusActivity',
  AIStatusActivityLayout,
);
