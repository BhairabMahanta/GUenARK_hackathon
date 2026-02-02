// services/processSensorReading.service.ts
// Main orchestrator - processes sensor reading through entire pipeline

import { Drain, IDrain } from '../models/Drain';
import { SensorReading } from '../models/SensorReading';
import { DciTimeseries } from '../models/DciTimeseries';
import { DrainHealthTimeseries } from '../models/DrainHealthTimeseries';
import dciCalculationService from './dciCalculation.service';
import healthCalculationService from './healthCalculation.service';

interface ProcessingResult {
  drainId: number;
  dci: number;
  dciEff: number;
  degradationRateHr: number | null;
  timeToFailureHr: number | null;
  riskLevel: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'WATCH' | 'OFFLINE';
  status: 'safe' | 'watch' | 'warning' | 'critical' | 'offline';
}

class ProcessSensorReadingService {
  private readonly DCI_CRITICAL = 0.25;
  private readonly WATCH_HR = 3.0;
  private readonly WARNING_HR = 1.5;
  private readonly CRITICAL_HR = 0.5;
  private readonly MAX_TTF_HR = 6.0;

  /**
   * Complete pipeline: Sensor Reading → DCI → Health → Drain Update
   */
  async processSensorReading(
    drainId: number,
    waterLevelPercent: number,
    rainfallMmPerHour: number,
    flowRateLps: number,
    turbidityNtu: number,
    metadata?: any
  ): Promise<ProcessingResult> {
    try {
      // Step 0: Find drain
      const drain = await Drain.findOne({ drainId });
      if (!drain) {
        throw new Error(`Drain ${drainId} not found`);
      }

      const timestamp = new Date();

      // Step 1: Save sensor reading
      await SensorReading.create({
        drainId,
        timestamp,
        waterLevelPercent,
        rainfallMmPerHour,
        flowRateLps,
        turbidityNtu,
        metadata
      });

      // Step 2: Calculate DCI metrics
      const dciResult = dciCalculationService.calculateDCI({
        waterLevelPercent,
        rainfallMmPerHour,
        flowRateLps,
        turbidityNtu
      });

      // Step 3: Save to DCI timeseries
      await DciTimeseries.create({
        drainId,
        timestamp,
        dci: dciResult.dci,
        lEff: dciResult.lEff,
        bEff: dciResult.bEff,
        fEff: dciResult.fEff
      });

      // Step 4: Calculate health metrics (with history)
      const healthMetrics = await healthCalculationService.calculateHealthMetrics(
        drainId,
        dciResult.dci
      );

      // Step 5: Calculate time to failure
      const timeToFailureHr = this.calculateTimeToFailure(
        healthMetrics.dciEff,
        healthMetrics.degradationRateHr
      );

      // Step 6: Classify risk
      const riskLevel = this.classifyRisk(timeToFailureHr);
      const status = this.mapRiskToStatus(riskLevel);

      // Step 7: Save to health timeseries
      await DrainHealthTimeseries.create({
        drainId,
        timestamp,
        dci: dciResult.dci,
        dciEff: healthMetrics.dciEff,
        degradationRateHr: healthMetrics.degradationRateHr
      });

      // Step 8: Update Drain document
      await this.updateDrainDocument(
        drain,
        waterLevelPercent,
        dciResult,
        healthMetrics,
        timeToFailureHr,
        riskLevel,
        status,
        timestamp
      );

      return {
        drainId,
        dci: dciResult.dci,
        dciEff: healthMetrics.dciEff,
        degradationRateHr: healthMetrics.degradationRateHr,
        timeToFailureHr,
        riskLevel,
        status
      };

    } catch (error) {
      console.error(`❌ Error processing sensor reading for drain ${drainId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate time to failure (matches Python predict_failure.py)
   */
  private calculateTimeToFailure(dciEff: number, degradationRateHr: number | null): number | null {
    // Already failed
    if (dciEff <= this.DCI_CRITICAL) {
      return 0;
    }

    // Stable or recovering
    if (!degradationRateHr || degradationRateHr >= 0) {
      return null; // Infinity (no failure predicted)
    }

    const remaining = dciEff - this.DCI_CRITICAL;

    if (remaining <= 0) {
      return 0;
    }

    const ttf = remaining / Math.abs(degradationRateHr);

    return Math.min(ttf, this.MAX_TTF_HR);
  }

  /**
   * Classify risk level (matches Python predict_failure.py)
   */
  private classifyRisk(timeToFailureHr: number | null): 'NORMAL' | 'WARNING' | 'CRITICAL' | 'WATCH' | 'OFFLINE' {
    if (timeToFailureHr === null) return 'NORMAL';
    if (timeToFailureHr === 0) return 'OFFLINE';
    if (timeToFailureHr <= this.CRITICAL_HR) return 'CRITICAL';
    if (timeToFailureHr <= this.WARNING_HR) return 'WARNING';
    if (timeToFailureHr <= this.WATCH_HR) return 'WATCH';
    return 'NORMAL';
  }

  /**
   * Map risk level to drain status
   */
  private mapRiskToStatus(risk: string): 'safe' | 'watch' | 'warning' | 'critical' | 'offline' {
    const map: Record<string, 'safe' | 'watch' | 'warning' | 'critical' | 'offline'> = {
      'NORMAL': 'safe',
      'WATCH': 'watch',
      'WARNING': 'warning',
      'CRITICAL': 'critical',
      'OFFLINE': 'offline'
    };
    return map[risk] || 'offline';
  }

  /**
   * Update Drain document with latest metrics
   */
  private async updateDrainDocument(
    drain: IDrain,
    waterLevel: number,
    dciResult: any,
    healthMetrics: any,
    timeToFailureHr: number | null,
    riskLevel: string,
    status: string,
    timestamp: Date
  ) {
    drain.currentWaterLevel = waterLevel;
    drain.lastSensorUpdate = timestamp;
    drain.status = status as any;

    drain.currentMetrics = {
      dci: dciResult.dci,
      dciEff: healthMetrics.dciEff,
      degradationRateHr: healthMetrics.degradationRateHr,
      timeToFailureHr,
      riskLevel: riskLevel as any,
      lEff: dciResult.lEff,
      bEff: dciResult.bEff,
      fEff: dciResult.fEff
    };

    // Calculate blockage factor (inverse of B_eff)
    drain.blockageFactor = Math.max(0.1, 1 - dciResult.bEff);

    // Update effective capacity based on DCI
    if (drain.capacity) {
      drain.effectiveCapacity = drain.capacity * healthMetrics.dciEff;
    }

    // Calculate time to fill (in minutes)
    if (timeToFailureHr !== null && timeToFailureHr > 0) {
      drain.timeToFill = timeToFailureHr * 60; // Convert to minutes
    } else if (timeToFailureHr === 0) {
      drain.timeToFill = 0;
    } else {
      drain.timeToFill = 360; // Default 6 hours if stable
    }

    await drain.save();
  }
}

export default new ProcessSensorReadingService();
