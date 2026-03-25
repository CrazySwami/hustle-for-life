'use widget';

import { Text, View } from 'react-native';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';
import type { LiveActivityLayout } from 'expo-widgets/src/Widgets.types';

type HealthActivityProps = {
  steps: number;
  heartRate: number;
  goalProgress: number;
  status: string;
};

function HealthActivityLayout(
  props: HealthActivityProps,
  _env: LiveActivityEnvironment,
): LiveActivityLayout {
  const { steps, heartRate, goalProgress, status } = props;
  const progressPercent = Math.min(goalProgress * 100, 100);
  const progressColor = progressPercent >= 100 ? '#34C759' : '#FF3B30';

  return {
    banner: (
      <View style={{ flex: 1, backgroundColor: '#000', padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#FF3B30', letterSpacing: 1.5 }}>
            HUSTLE FOR LIFE
          </Text>
          <Text style={{ fontSize: 11, color: '#888' }}>{status}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 14 }}>
          <View style={{ flex: 1, backgroundColor: '#111', borderRadius: 12, padding: 12 }}>
            <Text style={{ fontSize: 14, marginBottom: 4 }}>{'\uD83D\uDEB6'}</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>
              {steps.toLocaleString()}
            </Text>
            <Text style={{ fontSize: 10, color: '#888', marginTop: 2 }}>steps</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#111', borderRadius: 12, padding: 12 }}>
            <Text style={{ fontSize: 14, marginBottom: 4 }}>{'\u2665\uFE0F'}</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#FF3B30' }}>
              {heartRate}
            </Text>
            <Text style={{ fontSize: 10, color: '#888', marginTop: 2 }}>bpm</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={{ marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 10, color: '#888' }}>Daily Goal</Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: progressColor }}>
              {progressPercent.toFixed(0)}%
            </Text>
          </View>
          <View style={{ height: 6, backgroundColor: '#222', borderRadius: 3 }}>
            <View
              style={{
                height: 6,
                width: `${progressPercent}%` as any,
                backgroundColor: progressColor,
                borderRadius: 3,
              }}
            />
          </View>
        </View>
      </View>
    ),

    compactLeading: (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 4 }}>
        <Text style={{ fontSize: 12 }}>{'\uD83D\uDEB6'}</Text>
        <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>
          {(steps / 1000).toFixed(1)}k
        </Text>
      </View>
    ),

    compactTrailing: (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#FF3B30' }}>
          {heartRate}
        </Text>
        <Text style={{ fontSize: 10, color: '#888' }}>bpm</Text>
      </View>
    ),

    minimal: (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: 2.5,
            borderColor: progressColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 7, fontWeight: '800', color: '#fff' }}>
            {progressPercent.toFixed(0)}
          </Text>
        </View>
      </View>
    ),

    expandedCenter: (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12 }}>
        <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-end' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 32, fontWeight: '800', color: '#fff' }}>
              {steps.toLocaleString()}
            </Text>
            <Text style={{ fontSize: 11, color: '#888', marginTop: 4 }}>steps</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 32, fontWeight: '800', color: '#FF3B30' }}>
              {heartRate}
            </Text>
            <Text style={{ fontSize: 11, color: '#888', marginTop: 4 }}>bpm</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 32, fontWeight: '800', color: progressColor }}>
              {progressPercent.toFixed(0)}%
            </Text>
            <Text style={{ fontSize: 11, color: '#888', marginTop: 4 }}>goal</Text>
          </View>
        </View>
      </View>
    ),

    expandedBottom: (
      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <Text style={{ fontSize: 13, color: '#555' }}>Tap to log health data</Text>
      </View>
    ),
  };
}

export const healthActivity = createLiveActivity<HealthActivityProps>(
  'HealthActivity',
  HealthActivityLayout,
);
