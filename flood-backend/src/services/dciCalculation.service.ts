// services/dciCalculation.service.ts
// Replicates Python compute_dci.py logic

interface SensorInput {
  waterLevelPercent: number;
  rainfallMmPerHour: number;
  flowRateLps: number;
  turbidityNtu: number;
}

interface DCIResult {
  dci: number;
  lEff: number;
  bEff: number;
  fEff: number;
  dcfEff: number;
}

class DCICalculationService {
  // Configuration from Python
  private readonly EPS = 0.03;
  private readonly TURBIDITY_MAX = 250;
  private readonly FLOW_SCALE = 10;

  /**
   * Calculate DCI and efficiency factors from sensor reading
   * Matches Python compute_dci.py logic exactly
   */
  calculateDCI(sensor: SensorInput): DCIResult {
    // Step 1: Normalize raw sensor signals
    const level_ratio = Math.max(0, Math.min(1, sensor.waterLevelPercent / 100));
    const t_norm = Math.max(0, Math.min(1, sensor.turbidityNtu / this.TURBIDITY_MAX));
    const expected_flow = sensor.rainfallMmPerHour * this.FLOW_SCALE;

    // Step 2: Compute hydraulic efficiencies
    
    // L_eff: Level congestion efficiency (inverted quadratic)
    let lEff = 1 - (level_ratio ** 2);
    lEff = Math.max(this.EPS, Math.min(1, lEff));

    // B_eff: Blockage efficiency (turbidity impact)
    let bEff = 1 - t_norm;
    bEff = Math.max(this.EPS, Math.min(1, bEff));

    // F_eff: Flow efficiency (actual vs expected)
    const flow_ratio = sensor.flowRateLps / (expected_flow + 1e-6);
    let fEff = Math.max(this.EPS, Math.min(1, flow_ratio));

    // Step 3: Compute DCI (product of efficiencies)
    let dci = lEff * bEff * fEff;
    dci = Math.max(0, Math.min(1, dci));

    // Step 4: Compute geometric mean for dcfEff (used in health calcs)
    const dcfEff = Math.pow(lEff * bEff * fEff, 1/3);

    return {
      dci: parseFloat(dci.toFixed(6)),
      lEff: parseFloat(lEff.toFixed(6)),
      bEff: parseFloat(bEff.toFixed(6)),
      fEff: parseFloat(fEff.toFixed(6)),
      dcfEff: parseFloat(dcfEff.toFixed(6))
    };
  }
}

export default new DCICalculationService();
