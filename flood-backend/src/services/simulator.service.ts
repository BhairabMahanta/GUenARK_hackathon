// services/simulator.service.ts
// Generates realistic sensor readings matching your CSV patterns

import { Drain } from '../models/Drain';
import processSensorReadingService from './processSensorReading.service';

type WeatherMode = 'normal' | 'heavy_rain' | 'extreme';

interface SimulationConfig {
  weatherMode: WeatherMode;
  affectedZones?: string[]; // Target specific zones for localized flooding
}

class SimulatorService {
  private weatherMode: WeatherMode = 'normal';
  private simulationStep = 0;

  /**
   * Generate sensor readings for all drains
   */
  async generateRound(config?: SimulationConfig): Promise<void> {
    const mode = config?.weatherMode || this.weatherMode;
    const affectedZones = config?.affectedZones || [];

    console.log(`\n🌧️  === SIMULATION ROUND ${++this.simulationStep} ===`);
    console.log(`Weather: ${mode.toUpperCase()}`);
    
    const drains = await Drain.find({}).lean();
    console.log(`Generating readings for ${drains.length} drains...`);

    let processed = 0;
    const batchSize = 20;

    for (let i = 0; i < drains.length; i += batchSize) {
      const batch = drains.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (drain) => {
          const isAffected = affectedZones.length === 0 || 
                            affectedZones.includes(drain.zoneId);
          
          const reading = this.generateReading(drain, mode, isAffected);
          
          try {
            await processSensorReadingService.processSensorReading(
              drain.drainId,
              reading.waterLevelPercent,
              reading.rainfallMmPerHour,
              reading.flowRateLps,
              reading.turbidityNtu,
              { simulated: true, weatherMode: mode }
            );
            processed++;
          } catch (error) {
            console.error(`Error processing drain ${drain.drainId}:`, error);
          }
        })
      );

      process.stdout.write(`\r✅ Processed: ${processed}/${drains.length}`);
    }

    console.log(`\n✅ Simulation round complete\n`);
  }

  /**
   * Generate realistic sensor reading for a single drain
   */
  private generateReading(
    drain: any,
    mode: WeatherMode,
    isAffected: boolean
  ) {
    const baseVariance = drain.vulnerabilityFactor || 1.0;
    
    let waterLevel: number;
    let rainfall: number;
    let flowRate: number;
    let turbidity: number;

    // Add some randomness/noise
    const noise = () => 0.9 + Math.random() * 0.2; // 0.9-1.1

    if (mode === 'normal') {
      waterLevel = this.randomRange(20, 40) * baseVariance * noise();
      rainfall = this.randomRange(0, 5);
      flowRate = this.randomRange(10, 30) * noise();
      turbidity = this.generateTurbidity('normal', drain);
      
    } else if (mode === 'heavy_rain') {
      const intensity = isAffected ? 1.3 : 1.0;
      waterLevel = this.randomRange(60, 85) * baseVariance * intensity * noise();
      rainfall = this.randomRange(20, 50) * intensity;
      flowRate = this.randomRange(5, 15) * noise(); // Reduced due to blockage
      turbidity = this.generateTurbidity('heavy', drain);
      
    } else { // extreme
      const intensity = isAffected ? 1.5 : 1.2;
      waterLevel = this.randomRange(75, 95) * baseVariance * intensity;
      rainfall = this.randomRange(50, 100) * intensity;
      flowRate = this.randomRange(2, 8); // Severely reduced
      turbidity = this.generateTurbidity('extreme', drain);
    }

    return {
      waterLevelPercent: Math.min(100, waterLevel),
      rainfallMmPerHour: Math.max(0, rainfall),
      flowRateLps: Math.max(0.5, flowRate),
      turbidityNtu: Math.min(250, Math.max(0, turbidity))
    };
  }

  /**
   * Generate realistic turbidity based on drain conditions
   * Turbidity depends on: drain type, blockage history, flow conditions
   */
  private generateTurbidity(condition: 'normal' | 'heavy' | 'extreme', drain: any): number {
    const drainType = drain.dimensions?.drainType || 'medium_road';
    const blockageFactor = drain.blockageFactor || 0.3;

    // Base turbidity by drain type
    let baseTurbidity: number;
    
    if (drainType === 'small_residential') {
      baseTurbidity = this.randomRange(10, 40); // Higher in residential
    } else if (drainType === 'large_arterial') {
      baseTurbidity = this.randomRange(5, 20); // Lower in maintained arterials
    } else {
      baseTurbidity = this.randomRange(8, 30);
    }

    // Condition multipliers
    const conditionMultiplier = {
      'normal': 1.0,
      'heavy': 2.5,   // Sediment stirred up
      'extreme': 4.0  // Severe debris
    }[condition];

    // Blockage effect (higher blockage → higher turbidity)
    const blockageMultiplier = 1 + (blockageFactor * 2);

    let turbidity = baseTurbidity * conditionMultiplier * blockageMultiplier;

    // Add temporal variance (some drains get worse over time)
    const degradation = Math.random() > 0.7 ? this.randomRange(1.0, 1.3) : 1.0;
    turbidity *= degradation;

    return turbidity;
  }

  /**
   * Set weather mode for subsequent rounds
   */
  setWeatherMode(mode: WeatherMode): void {
    this.weatherMode = mode;
    console.log(`🌤️  Weather mode set to: ${mode.toUpperCase()}`);
  }

  /**
   * Helper: Random value in range
   */
  private randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}

export default new SimulatorService();
