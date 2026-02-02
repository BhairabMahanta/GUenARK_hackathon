// types/metrics.types.ts
export interface DciTimeseries {
  _id: string;
  drainId: number;
  timestamp: Date;
  dci: number;
  lEff: number;
  bEff: number;
  fEff: number;
}

export interface HealthTimeseries {
  _id: string;
  drainId: number;
  timestamp: Date;
  dci: number;
  dciEff: number;
  degradationRateHr: number | null;
}

export interface ChartDataPoint {
  timestamp: string | Date;
  value: number;
  label?: string;
}
