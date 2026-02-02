// services/mqtt.service.ts (COMPLETE)
import mqtt, { MqttClient } from 'mqtt';
import drainService from './drain.service';
import sensorService from './sensor.service';
import alertService from './alert.service';
import socketService from './socket.service';

class MQTTService {
  private client: MqttClient | null = null;

  initialize() {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    
    this.client = mqtt.connect(brokerUrl);

    this.client.on('connect', () => {
      console.log('[MQTT] Connected to broker');
      this.subscribeToTopics();
    });

    this.client.on('message', this.handleMessage.bind(this));
    
    this.client.on('error', (error) => {
      console.error('[MQTT] Connection error:', error);
    });
  }

  private subscribeToTopics() {
    if (!this.client) return;

    const topics = [
      'sensors/+/water-level',
      'sensors/+/turbidity',
      'sensors/+/flow-rate',
      'weather/+/rainfall'
    ];

    topics.forEach(topic => {
      this.client?.subscribe(topic, (err) => {
        if (err) {
          console.error(`[MQTT] Subscription error for ${topic}:`, err);
        } else {
          console.log(`[MQTT] Subscribed to ${topic}`);
        }
      });
    });
  }

  private async handleMessage(topic: string, message: Buffer) {
    try {
      const parts = topic.split('/');
      
      if (parts[0] === 'sensors' && parts.length === 3) {
        await this.handleSensorMessage(parts[1], parts[2], message);
      } else if (parts[0] === 'weather' && parts[2] === 'rainfall') {
        await this.handleRainfallMessage(parts[1], message);
      }
    } catch (error) {
      console.error('[MQTT] Message processing error:', error);
    }
  }

  private async handleSensorMessage(drainIdStr: string, sensorType: string, message: Buffer) {
    try {
      const value = parseFloat(message.toString());
      const drainId = parseInt(drainIdStr); // Convert to number

      if (isNaN(value) || isNaN(drainId)) {
        console.error(`[MQTT] Invalid data for drain ${drainIdStr}:`, message.toString());
        return;
      }

      console.log(`[MQTT] Received ${sensorType} for drain ${drainId}: ${value}`);

      let sensorData: any = {};

      switch (sensorType) {
        case 'water-level':
          if (value < 0 || value > 100) {
            console.error(`[MQTT] Invalid water level: ${value}`);
            return;
          }
          sensorData.waterLevel = value;
          break;

        case 'turbidity':
          if (value < 0 || value > 100) {
            console.error(`[MQTT] Invalid turbidity: ${value}`);
            return;
          }
          sensorData.turbidity = value;
          break;

        case 'flow-rate':
          if (value < 0) {
            console.error(`[MQTT] Invalid flow rate: ${value}`);
            return;
          }
          sensorData.flowRate = value;
          break;

        default:
          console.warn(`[MQTT] Unknown sensor type: ${sensorType}`);
          return;
      }

      await this.processSensorData(drainId, sensorData);
      
    } catch (error) {
      console.error(`[MQTT] Error handling sensor message:`, error);
    }
  }

  private async handleRainfallMessage(zoneOrCity: string, message: Buffer) {
    try {
      const rainfall = parseFloat(message.toString());

      if (isNaN(rainfall) || rainfall < 0) {
        console.error(`[MQTT] Invalid rainfall data: ${message.toString()}`);
        return;
      }

      console.log(`[MQTT] Received rainfall for ${zoneOrCity}: ${rainfall} mm/hr`);
      
      // TODO: Apply rainfall to all drains in zone
      
    } catch (error) {
      console.error(`[MQTT] Error handling rainfall message:`, error);
    }
  }

  private async processSensorData(drainId: number, sensorData: any) {
    try {
      // Get current drain status
      const currentDrain = await drainService.getDrainById(drainId);
      const oldStatus = currentDrain.status;

      // Update drain with physics calculations
      const updatedDrain = await drainService.updateDrainFromSensorData(
        drainId,
        sensorData
      );
      
      if (!updatedDrain) return;

      const zoneId = updatedDrain.zoneId.toString();

      console.log(`[MQTT] Drain ${drainId} updated:`, {
        waterLevel: updatedDrain.currentWaterLevel,
        status: updatedDrain.status,
        timeToFill: updatedDrain.timeToFill,
        stressIndex: updatedDrain.stressIndex
      });

      // Emit sensor update via WebSocket
      socketService.emitSensorUpdate(zoneId, {
        drainId: updatedDrain.drainId,
        waterLevel: updatedDrain.currentWaterLevel,
        status: updatedDrain.status,
        timestamp: new Date()
      });

      // Emit status change if changed
      if (oldStatus !== updatedDrain.status) {
        console.log(`[MQTT] Drain ${drainId} status changed: ${oldStatus} → ${updatedDrain.status}`);
        
        socketService.emitDrainStatusChange(zoneId, {
          drainId: updatedDrain.drainId,
          oldStatus,
          newStatus: updatedDrain.status,
          currentLevel: updatedDrain.currentWaterLevel
        });
      }

      // Create alerts based on time to fill
      await this.checkAndCreateAlerts(updatedDrain);

      // Update basin aggregates
      await this.updateBasinAggregates(updatedDrain.basinId);
      
    } catch (error) {
      console.error(`[MQTT] Error processing sensor data for drain ${drainId}:`, error);
    }
  }

  private async checkAndCreateAlerts(drain: any) {
    const { status, timeToFill, currentWaterLevel, stressIndex, name, drainId } = drain;

    if (status === 'critical') {
      const alert = await alertService.createAlert({
        type: 'sensor',
        severity: 'critical',
        message: timeToFill !== null 
          ? `CRITICAL: Drain ${drainId} will overflow in ${timeToFill.toFixed(1)} minutes!`
          : `CRITICAL: Drain ${drainId} at ${currentWaterLevel}% capacity`,
        drainId: drain._id,
        zoneId: drain.zoneId,
        data: { 
          waterLevel: currentWaterLevel, 
          timeToFill,
          stressIndex 
        }
      });

      socketService.emitCriticalAlert(alert);
      console.log(`[MQTT] 🚨 CRITICAL ALERT: Drain ${drainId} - ${timeToFill?.toFixed(1)} min to overflow`);
    } 
    else if (status === 'warning') {
      const alert = await alertService.createAlert({
        type: 'sensor',
        severity: 'warning',
        message: timeToFill !== null
          ? `WARNING: Drain ${drainId} will overflow in ${timeToFill.toFixed(1)} minutes`
          : `WARNING: High water level at drain ${drainId}: ${currentWaterLevel}%`,
        drainId: drain._id,
        zoneId: drain.zoneId,
        data: { 
          waterLevel: currentWaterLevel, 
          timeToFill,
          stressIndex 
        }
      });

      socketService.emitNewAlert(alert);
      console.log(`[MQTT] ⚠️ WARNING: Drain ${drainId} - ${timeToFill?.toFixed(1)} min to overflow`);
    }
    else if (status === 'watch' && stressIndex > 60) {
      const alert = await alertService.createAlert({
        type: 'sensor',
        severity: 'warning',
        message: `WATCH: Drain ${drainId} stress level high (${stressIndex.toFixed(0)})`,
        drainId: drain._id,
        zoneId: drain.zoneId,
        data: { 
          waterLevel: currentWaterLevel, 
          timeToFill,
          stressIndex 
        }
      });

      socketService.emitNewAlert(alert);
    }
  }

  private async updateBasinAggregates(basinId: string) {
    try {
      const aggregateData = await sensorService.getBasinAggregate(basinId);
      socketService.emitBasinAggregateUpdate(basinId, aggregateData);
    } catch (error) {
      console.error(`[MQTT] Error updating basin aggregates for ${basinId}:`, error);
    }
  }

  publish(topic: string, message: string) {
    if (!this.client) {
      console.error('[MQTT] Cannot publish - client not connected');
      return;
    }
    this.client.publish(topic, message);
    console.log(`[MQTT] Published to ${topic}: ${message}`);
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      console.log('[MQTT] Disconnected from broker');
    }
  }
}

export default new MQTTService();
