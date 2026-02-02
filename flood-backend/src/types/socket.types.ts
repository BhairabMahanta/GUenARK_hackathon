// types/socket.types.ts (COMPLETE)
import { Server, Socket } from 'socket.io';

export interface SocketData {
  userId?: string;
  zones: Set<string>;
  drains: Set<string>;
}

export interface ServerToClientEvents {
  'sensor-update': (data: SensorUpdatePayload) => void;
  'drain-status-change': (data: DrainStatusPayload) => void;
  'new-report': (data: any) => void;
  'new-alert': (data: any) => void;
  'critical-alert': (data: any) => void;
  'prediction-update': (data: any) => void;
  'basin-aggregate-update': (data: any) => void;
}

export interface ClientToServerEvents {
  'join-zone': (zoneId: string) => void;
  'leave-zone': (zoneId: string) => void;
  'subscribe-drain': (drainId: number) => void; // Changed to number
}

export interface SensorUpdatePayload {
  drainId: number; // Changed to number
  waterLevel: number;
  status: string;
  timestamp: Date;
}

export interface DrainStatusPayload {
  drainId: number; // Changed to number
  oldStatus: string;
  newStatus: string;
  currentLevel: number;
}

export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
