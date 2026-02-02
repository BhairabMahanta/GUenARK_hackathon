// scripts/run-simulator.ts
// Continuous simulator - runs every 2 minutes

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import simulatorService from '../services/simulator.service';

dotenv.config();

const INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

let roundCount = 0;

const runSimulator = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('📡 Simulator connected to MongoDB\n');

    // Initial round
    await simulatorService.generateRound();

    // Schedule weather changes
    scheduleWeatherChanges();

    // Continuous simulation
    setInterval(async () => {
      roundCount++;
      
      try {
        await simulatorService.generateRound();
      } catch (error) {
        console.error('❌ Simulation error:', error);
      }
    }, INTERVAL_MS);

  } catch (error) {
    console.error('❌ Simulator startup failed:', error);
    process.exit(1);
  }
};

/**
 * Simulate realistic weather patterns
 */
const scheduleWeatherChanges = () => {
  // After 10 minutes → heavy rain
  setTimeout(() => {
    console.log('\n⚠️  WEATHER CHANGE: Heavy rain starting...\n');
    simulatorService.setWeatherMode('heavy_rain');
  }, 10 * 60 * 1000);

  // After 30 minutes → back to normal
  setTimeout(() => {
    console.log('\n🌤️  WEATHER CHANGE: Returning to normal...\n');
    simulatorService.setWeatherMode('normal');
  }, 30 * 60 * 1000);

  // After 45 minutes → extreme event
  setTimeout(() => {
    console.log('\n🚨 WEATHER CHANGE: EXTREME EVENT!\n');
    simulatorService.setWeatherMode('extreme');
  }, 45 * 60 * 1000);
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Simulator stopping...');
  await mongoose.disconnect();
  process.exit(0);
});

runSimulator();
