import { TypedServer, TypedSocket, SensorUpdatePayload, DrainStatusPayload, ServerToClientEvents } from '../types/socket.types';
import { SOCKET_EVENTS } from '../config/constants';

class SocketService {
  private io: TypedServer | null = null;

  initialize(io: TypedServer) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket: TypedSocket) => {
      console.log(`[SOCKET] Client connected: ${socket.id}`);

      // Handle zone subscription
      socket.on(SOCKET_EVENTS.JOIN_ZONE, (zoneId: string) => {
        socket.join(`zone:${zoneId}`);
        console.log(`[SOCKET] ${socket.id} joined zone:${zoneId}`);
      });

      socket.on(SOCKET_EVENTS.LEAVE_ZONE, (zoneId: string) => {
        socket.leave(`zone:${zoneId}`);
        console.log(`[SOCKET] ${socket.id} left zone:${zoneId}`);
      });

      // Handle drain subscription
      socket.on(SOCKET_EVENTS.SUBSCRIBE_DRAIN, (drainId: number) => {
        socket.join(`drain:${drainId}`);
        console.log(`[SOCKET] ${socket.id} subscribed to drain:${drainId}`);
      });

      socket.on('disconnect', () => {
        console.log(`[SOCKET] Client disconnected: ${socket.id}`);
      });
    });
  }

  // Emit to specific zone
  emitToZone(zoneId: string, event: keyof ServerToClientEvents, data: any) {
    if (!this.io) return;
    this.io.to(`zone:${zoneId}`).emit(event, data);
    console.log(`[SOCKET] Emitted ${event} to zone:${zoneId}`);
  }

  // Emit to specific drain subscribers
  emitToDrain(drainId: string, event: keyof ServerToClientEvents, data: any) {
    if (!this.io) return;
    this.io.to(`drain:${drainId}`).emit(event, data);
  }

  // Broadcast globally
  broadcast(event: keyof ServerToClientEvents, data: any) {
    if (!this.io) return;
    this.io.emit(event, data);
    console.log(`[SOCKET] Broadcasted ${event} globally`);
  }

  // Specific event emitters
  emitSensorUpdate(zoneId: string, payload: SensorUpdatePayload) {
    this.emitToZone(zoneId, SOCKET_EVENTS.SENSOR_UPDATE, payload);
  }

  emitDrainStatusChange(zoneId: string, payload: DrainStatusPayload) {
    this.emitToZone(zoneId, SOCKET_EVENTS.DRAIN_STATUS_CHANGE, payload);
  }

  emitNewReport(zoneId: string, report: any) {
    this.emitToZone(zoneId, SOCKET_EVENTS.NEW_REPORT, report);
  }

  emitNewAlert(alert: any) {
    this.broadcast(SOCKET_EVENTS.NEW_ALERT, alert);
  }

  emitCriticalAlert(alert: any) {
    this.broadcast(SOCKET_EVENTS.CRITICAL_ALERT, alert);
  }

  emitPredictionUpdate(zoneId: string, prediction: any) {
    this.emitToZone(zoneId, SOCKET_EVENTS.PREDICTION_UPDATE, prediction);
  }

  emitBasinAggregateUpdate(basin: string, data: any) {
    this.broadcast(SOCKET_EVENTS.BASIN_AGGREGATE_UPDATE, { basin, ...data });
  }
}

export default new SocketService();
