// services/healthCalculation.service.ts
// Replicates Python compute_health.py logic

import { DciTimeseries } from '../models/DciTimeseries';

interface HealthMetrics {
  dciEff: number;
  degradationRateHr: number | null;
}

class HealthCalculationService {
  // Configuration from Python
  private readonly WINDOW_STEPS = 5;        // 10 minutes lookback
  private readonly MINUTES_PER_STEP = 2;    // 2 min per reading
  private readonly EMA_ALPHA = 0.2;         // smoothing factor
  private readonly MAX_RATE = 0.2;          // max degradation per hour

  /**
   * Calculate smoothed DCI and degradation rate for a drain
   * Matches Python compute_health.py logic
   */
  async calculateHealthMetrics(drainId: number, currentDCI: number): Promise<HealthMetrics> {
    // Get recent DCI history (last ~20 readings for context)
    const recentDCI = await DciTimeseries
      .find({ drainId })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();

    if (recentDCI.length === 0) {
      // First reading - no history
      return {
        dciEff: currentDCI,
        degradationRateHr: null
      };
    }

    // Step 1: Apply EMA smoothing (Exponential Moving Average)
    // Most recent value first in array, so reverse for EMA calc
    const dciValues = [currentDCI, ...recentDCI.map(r => r.dci)];
    const dciEff = this.calculateEMA(dciValues, this.EMA_ALPHA);

    // Step 2: Calculate degradation rate
    let degradationRateHr: number | null = null;

    if (recentDCI.length >= this.WINDOW_STEPS) {
      // Get DCI from WINDOW_STEPS ago (10 minutes back)
      const previousReading = recentDCI[this.WINDOW_STEPS - 1];
      
      if (previousReading && previousReading.dci !== undefined) {
        // Calculate change rate per hour
        const timeDiffHours = (this.WINDOW_STEPS * this.MINUTES_PER_STEP) / 60;
        const dciChange = dciEff - previousReading.dci;
        
        let rate = dciChange / timeDiffHours;
        
        // Apply physical clamp
        rate = Math.max(-this.MAX_RATE, Math.min(this.MAX_RATE, rate));
        
        degradationRateHr = parseFloat(rate.toFixed(6));
      }
    }

    return {
      dciEff: parseFloat(dciEff.toFixed(6)),
      degradationRateHr
    };
  }

  /**
   * Calculate Exponential Moving Average
   * Matches pandas.ewm(alpha=X).mean() behavior
   */
  private calculateEMA(values: number[], alpha: number): number {
    if (values.length === 0) return 0;
    if (values.length === 1) return values[0];

    let ema = values[0];
    
    for (let i = 1; i < values.length; i++) {
      ema = alpha * values[i] + (1 - alpha) * ema;
    }

    return ema;
  }
}

export default new HealthCalculationService();
