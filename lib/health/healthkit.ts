import {
  isHealthDataAvailable,
  requestAuthorization,
  queryQuantitySamples,
  queryCategorySamples,
} from '@kingstinct/react-native-healthkit';
import type { QuantitySample } from '@kingstinct/react-native-healthkit';

// --- Type Identifiers ---

const QUANTITY_READ_TYPES = [
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierHeartRate',
  'HKQuantityTypeIdentifierRestingHeartRate',
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  'HKQuantityTypeIdentifierBloodPressureSystolic',
  'HKQuantityTypeIdentifierBloodPressureDiastolic',
  'HKQuantityTypeIdentifierBloodGlucose',
  'HKQuantityTypeIdentifierBodyMass',
  'HKQuantityTypeIdentifierBodyFatPercentage',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
] as const;

const CATEGORY_READ_TYPES = [
  'HKCategoryTypeIdentifierSleepAnalysis',
] as const;

const CORRELATION_READ_TYPES = [
  'HKCorrelationTypeIdentifierBloodPressure',
] as const;

// --- Exported Types ---

export interface HealthDataPoint {
  readonly value: number;
  readonly unit: string;
  readonly startDate: Date;
  readonly endDate: Date;
}

export interface BloodPressureReading {
  readonly systolic: number;
  readonly diastolic: number;
  readonly unit: string;
  readonly date: Date;
}

export interface SleepSegment {
  readonly value: number;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly durationMinutes: number;
}

export interface SleepAnalysis {
  readonly totalMinutes: number;
  readonly segments: readonly SleepSegment[];
}

export interface LatestValue<T = HealthDataPoint> {
  readonly latest: T | null;
  readonly timeSeries: readonly T[];
}

export interface AllHealthData {
  readonly steps: LatestValue;
  readonly heartRate: LatestValue;
  readonly restingHeartRate: LatestValue;
  readonly hrv: LatestValue;
  readonly bloodPressure: LatestValue<BloodPressureReading>;
  readonly bloodGlucose: LatestValue;
  readonly weight: LatestValue;
  readonly bodyFatPercentage: LatestValue;
  readonly activeEnergyBurned: LatestValue;
  readonly sleep: LatestValue<SleepSegment> & { readonly totalMinutes: number };
}

// --- Helpers ---

const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
};

const toHealthDataPoint = (sample: QuantitySample): HealthDataPoint => ({
  value: sample.quantity,
  unit: sample.unit,
  startDate: sample.startDate,
  endDate: sample.endDate,
});

const buildLatestValue = (samples: readonly QuantitySample[]): LatestValue => {
  const points = samples.map(toHealthDataPoint);
  return {
    latest: points[0] ?? null,
    timeSeries: points,
  };
};

// --- Core Functions ---

export const isHealthKitAvailable = (): boolean => isHealthDataAvailable();

export const requestPermissions = async (): Promise<boolean> => {
  const readIdentifiers = [
    ...QUANTITY_READ_TYPES,
    ...CATEGORY_READ_TYPES,
    ...CORRELATION_READ_TYPES,
  ];
  return requestAuthorization(readIdentifiers as unknown as string[], []);
};

const queryQuantity = async (
  identifier: (typeof QUANTITY_READ_TYPES)[number],
  days: number = 7,
  unit?: string,
): Promise<readonly QuantitySample[]> => {
  const from = daysAgo(days);
  return queryQuantitySamples(identifier, {
    ascending: false,
    limit: 0,
    ...(unit ? { unit } : {}),
    filter: {
      date: { startDate: from, endDate: new Date() },
    },
  });
};

// --- Data Fetchers ---

export const fetchSteps = async (days = 7): Promise<LatestValue> => {
  const samples = await queryQuantity('HKQuantityTypeIdentifierStepCount', days, 'count');
  return buildLatestValue(samples);
};

export const fetchHeartRate = async (days = 7): Promise<LatestValue> => {
  const samples = await queryQuantity('HKQuantityTypeIdentifierHeartRate', days, 'count/min');
  return buildLatestValue(samples);
};

export const fetchRestingHeartRate = async (days = 7): Promise<LatestValue> => {
  const samples = await queryQuantity('HKQuantityTypeIdentifierRestingHeartRate', days, 'count/min');
  return buildLatestValue(samples);
};

export const fetchHRV = async (days = 7): Promise<LatestValue> => {
  const samples = await queryQuantity('HKQuantityTypeIdentifierHeartRateVariabilitySDNN', days, 'ms');
  return buildLatestValue(samples);
};

export const fetchBloodGlucose = async (days = 7): Promise<LatestValue> => {
  const samples = await queryQuantity('HKQuantityTypeIdentifierBloodGlucose', days, 'mg/dL');
  return buildLatestValue(samples);
};

export const fetchWeight = async (days = 7): Promise<LatestValue> => {
  const samples = await queryQuantity('HKQuantityTypeIdentifierBodyMass', days, 'lb');
  return buildLatestValue(samples);
};

export const fetchBodyFatPercentage = async (days = 7): Promise<LatestValue> => {
  const samples = await queryQuantity('HKQuantityTypeIdentifierBodyFatPercentage', days, '%');
  return buildLatestValue(samples);
};

export const fetchActiveEnergyBurned = async (days = 7): Promise<LatestValue> => {
  const samples = await queryQuantity('HKQuantityTypeIdentifierActiveEnergyBurned', days, 'kcal');
  return buildLatestValue(samples);
};

export const fetchBloodPressure = async (days = 7): Promise<LatestValue<BloodPressureReading>> => {
  const [systolicSamples, diastolicSamples] = await Promise.all([
    queryQuantity('HKQuantityTypeIdentifierBloodPressureSystolic', days, 'mmHg'),
    queryQuantity('HKQuantityTypeIdentifierBloodPressureDiastolic', days, 'mmHg'),
  ]);

  const readings: BloodPressureReading[] = systolicSamples.map((sys, i) => ({
    systolic: sys.quantity,
    diastolic: diastolicSamples[i]?.quantity ?? 0,
    unit: 'mmHg',
    date: sys.startDate,
  }));

  return {
    latest: readings[0] ?? null,
    timeSeries: readings,
  };
};

export const fetchSleep = async (days = 7): Promise<LatestValue<SleepSegment> & { totalMinutes: number }> => {
  const from = daysAgo(days);
  const samples = await queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', {
    ascending: false,
    limit: 0,
    filter: {
      date: { startDate: from, endDate: new Date() },
    },
  });

  const segments: SleepSegment[] = samples.map((s) => {
    const start = new Date(s.startDate);
    const end = new Date(s.endDate);
    const durationMinutes = (end.getTime() - start.getTime()) / 60000;
    return {
      value: s.value,
      startDate: start,
      endDate: end,
      durationMinutes,
    };
  });

  const totalMinutes = segments.reduce((sum, s) => sum + s.durationMinutes, 0);

  return {
    latest: segments[0] ?? null,
    timeSeries: segments,
    totalMinutes,
  };
};

// --- Aggregate Fetch ---

export const fetchAllHealthData = async (days = 7): Promise<AllHealthData> => {
  const [
    steps,
    heartRate,
    restingHeartRate,
    hrv,
    bloodPressure,
    bloodGlucose,
    weight,
    bodyFatPercentage,
    activeEnergyBurned,
    sleep,
  ] = await Promise.all([
    fetchSteps(days),
    fetchHeartRate(days),
    fetchRestingHeartRate(days),
    fetchHRV(days),
    fetchBloodPressure(days),
    fetchBloodGlucose(days),
    fetchWeight(days),
    fetchBodyFatPercentage(days),
    fetchActiveEnergyBurned(days),
    fetchSleep(days),
  ]);

  return {
    steps,
    heartRate,
    restingHeartRate,
    hrv,
    bloodPressure,
    bloodGlucose,
    weight,
    bodyFatPercentage,
    activeEnergyBurned,
    sleep,
  };
};
