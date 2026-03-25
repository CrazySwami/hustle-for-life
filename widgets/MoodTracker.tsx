'use widget';

import { Text, View } from 'react-native';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type MoodTrackerProps = {
  currentMood: string;
  moodEmoji: string;
  energy: number;
  streak: number;
  lastLoggedAt: string;
};

const ENERGY_BAR_COLORS = ['#FF3B30', '#FF9500', '#FF9500', '#34C759', '#34C759'];

function MoodTrackerWidget(props: MoodTrackerProps, env: WidgetEnvironment) {
  const { currentMood, moodEmoji, energy, streak, lastLoggedAt } = props;

  if (env.widgetFamily === 'systemSmall') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', padding: 14, borderRadius: 16 }}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: '#FF3B30', letterSpacing: 1 }}>
          MOOD
        </Text>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 40 }}>{moodEmoji}</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff', marginTop: 4 }}>
            {currentMood}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 9, color: '#555' }}>
            Energy: {energy}/10
          </Text>
          <Text style={{ fontSize: 9, color: '#555' }}>
            {streak}d streak
          </Text>
        </View>
      </View>
    );
  }

  // systemMedium
  return (
    <View style={{ flex: 1, backgroundColor: '#000', padding: 14, borderRadius: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: '#FF3B30', letterSpacing: 1 }}>
          MOOD TRACKER
        </Text>
        <Text style={{ fontSize: 9, color: '#555' }}>{lastLoggedAt}</Text>
      </View>
      <View style={{ flexDirection: 'row', flex: 1, marginTop: 8, gap: 12 }}>
        {/* Current mood */}
        <View style={{ flex: 1, backgroundColor: '#111', borderRadius: 12, padding: 10, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 32 }}>{moodEmoji}</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff', marginTop: 4 }}>
            {currentMood}
          </Text>
        </View>
        {/* Stats */}
        <View style={{ flex: 1, justifyContent: 'center', gap: 8 }}>
          <View style={{ backgroundColor: '#111', borderRadius: 10, padding: 10 }}>
            <Text style={{ fontSize: 9, color: '#888' }}>Energy Level</Text>
            <View style={{ flexDirection: 'row', gap: 2, marginTop: 4 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i < Math.ceil(energy / 2)
                      ? ENERGY_BAR_COLORS[Math.min(i, 4)]
                      : '#2A2A2A',
                  }}
                />
              ))}
            </View>
          </View>
          <View style={{ backgroundColor: '#111', borderRadius: 10, padding: 10 }}>
            <Text style={{ fontSize: 9, color: '#888' }}>Logging Streak</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#34C759', marginTop: 2 }}>
              {streak} days
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export const moodTracker = createWidget<MoodTrackerProps>(
  'MoodTracker',
  MoodTrackerWidget,
);
