'use widget';

import { Text, View } from 'react-native';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type HealthQuickViewProps = {
  steps: number;
  heartRate: number;
  sleep: number;
  calories: number;
  lastUpdated: string;
};

function HealthQuickViewWidget(
  props: HealthQuickViewProps,
  env: WidgetEnvironment,
) {
  const { steps, heartRate, sleep, calories, lastUpdated } = props;
  const isSmall = env.widgetFamily === 'systemSmall';
  const isLockScreen =
    env.widgetFamily === 'accessoryCircular' ||
    env.widgetFamily === 'accessoryRectangular';

  if (env.widgetFamily === 'accessoryCircular') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }}>
          {(steps / 1000).toFixed(1)}k
        </Text>
        <Text style={{ fontSize: 8, color: '#888' }}>steps</Text>
      </View>
    );
  }

  if (env.widgetFamily === 'accessoryRectangular') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 4 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>
          {steps.toLocaleString()} steps
        </Text>
        <Text style={{ fontSize: 10, color: '#888' }}>
          {'\u2665'} {heartRate} bpm · {sleep}h sleep
        </Text>
      </View>
    );
  }

  if (isSmall) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', padding: 12, borderRadius: 16 }}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: '#FF3B30', letterSpacing: 1 }}>
          HUSTLE
        </Text>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff' }}>
            {(steps / 1000).toFixed(1)}k
          </Text>
          <Text style={{ fontSize: 11, color: '#888', marginTop: 2 }}>steps today</Text>
        </View>
        <Text style={{ fontSize: 10, color: '#555' }}>
          {'\u2665'} {heartRate} · {calories} cal
        </Text>
      </View>
    );
  }

  // systemMedium
  return (
    <View style={{ flex: 1, backgroundColor: '#000', padding: 14, borderRadius: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#FF3B30', letterSpacing: 1 }}>
          HUSTLE FOR LIFE
        </Text>
        <Text style={{ fontSize: 9, color: '#555' }}>{lastUpdated}</Text>
      </View>
      <View style={{ flexDirection: 'row', flex: 1, marginTop: 8, gap: 12 }}>
        <MetricCard label="Steps" value={steps.toLocaleString()} icon={'\uD83D\uDEB6'} />
        <MetricCard label="Heart" value={`${heartRate}`} unit="bpm" icon={'\u2665'} />
        <MetricCard label="Sleep" value={`${sleep}h`} icon={'\uD83D\uDCA4'} />
        <MetricCard label="Cal" value={`${calories}`} icon={'\uD83D\uDD25'} />
      </View>
    </View>
  );
}

function MetricCard({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: string;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: '#111', borderRadius: 10, padding: 8, justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 14 }}>{icon}</Text>
      <View>
        <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>{value}</Text>
        {unit && <Text style={{ fontSize: 8, color: '#888' }}>{unit}</Text>}
        <Text style={{ fontSize: 9, color: '#555', marginTop: 2 }}>{label}</Text>
      </View>
    </View>
  );
}

export const healthQuickView = createWidget<HealthQuickViewProps>(
  'HealthQuickView',
  HealthQuickViewWidget,
);
