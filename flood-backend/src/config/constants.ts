export const THRESHOLDS = {
  CRITICAL: 85,
  WARNING: 70,
  SAFE: 40
} as const;

export const SOCKET_EVENTS = {
  // Client -> Server
  JOIN_ZONE: 'join-zone',
  LEAVE_ZONE: 'leave-zone',
  SUBSCRIBE_DRAIN: 'subscribe-drain',
  
  // Server -> Client
  SENSOR_UPDATE: 'sensor-update',
  DRAIN_STATUS_CHANGE: 'drain-status-change',
  NEW_REPORT: 'new-report',
  NEW_ALERT: 'new-alert',
  CRITICAL_ALERT: 'critical-alert',
  PREDICTION_UPDATE: 'prediction-update',
  BASIN_AGGREGATE_UPDATE: 'basin-aggregate-update'
} as const;

export const MQTT_TOPICS = {
  WATER_LEVEL: 'sensors/+/water-level',
  SENSOR_STATUS: 'sensors/+/status'
} as const;

export const CACHE_TTL = {
  PREDICTIONS: 900, // 15 minutes
  BASIN_STATS: 300, // 5 minutes
  DRAIN_LIST: 60 // 1 minute
} as const;
