'use widget';

import { Text, View } from 'react-native';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type StepCounterProps = {
  steps: number;
  goal: number;
};

function StepCounterWidget(props: StepCounterProps, env: WidgetEnvironment) {
  const { steps, goal } = props;
  const progress = Math.min(steps / goal, 1);
  const percentage = Math.round(progress * 100);

  if (env.widgetFamily === 'accessoryInline') {
    return (
      <Text style={{ color: '#fff', fontSize: 12 }}>
        {'\uD83D\uDEB6'} {steps.toLocaleString()} / {goal.toLocaleString()}
      </Text>
    );
  }

  if (env.widgetFamily === 'accessoryCircular') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff' }}>{percentage}%</Text>
        <Text style={{ fontSize: 7, color: '#888', marginTop: 1 }}>STEPS</Text>
      </View>
    );
  }

  // systemSmall
  return (
    <View style={{ flex: 1, backgroundColor: '#000', padding: 14, borderRadius: 16 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: '#FF3B30', letterSpacing: 1, marginBottom: 4 }}>
        STEPS
      </Text>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff' }}>
          {(steps / 1000).toFixed(1)}k
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <View style={{
            height: 4,
            width: 80,
            backgroundColor: '#2A2A2A',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <View style={{
              height: 4,
              width: 80 * progress,
              backgroundColor: progress >= 1 ? '#34C759' : '#FF3B30',
              borderRadius: 2,
            }} />
          </View>
        </View>
        <Text style={{ fontSize: 10, color: '#888', marginTop: 4 }}>
          {percentage}% of {(goal / 1000).toFixed(0)}k goal
        </Text>
      </View>
    </View>
  );
}

export const stepCounter = createWidget<StepCounterProps>(
  'StepCounter',
  StepCounterWidget,
);
