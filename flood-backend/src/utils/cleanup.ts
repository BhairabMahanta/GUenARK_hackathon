// utils/cleanup.ts
import { SensorReading, DciTimeseries, DrainHealthTimeseries } from '../models';

const MIN_READINGS_PER_DRAIN = 50; // Keep at least 50 readings
const MAX_AGE_HOURS = 2; // But delete anything older than 2 hours

export const cleanupOldData = async () => {
  console.log('🧹 Starting cleanup...');
  
  // Get all unique drain IDs
  const drainIds = await SensorReading.distinct('drainId');
  
  for (const drainId of drainIds) {
    // Count total readings for this drain
    const count = await SensorReading.countDocuments({ drainId });
    
    if (count > MIN_READINGS_PER_DRAIN) {
      // Get the 50th newest reading timestamp
      const readings = await SensorReading
        .find({ drainId })
        .sort({ timestamp: -1 })
        .limit(MIN_READINGS_PER_DRAIN)
        .select('timestamp');
      
      const cutoffTimestamp = readings[MIN_READINGS_PER_DRAIN - 1].timestamp;
      
      // Delete older readings
      const deleted = await SensorReading.deleteMany({
        drainId,
        timestamp: { $lt: cutoffTimestamp }
      });
      
      console.log(`Drain ${drainId}: Deleted ${deleted.deletedCount} old readings`);
    }
    
    // Also enforce hard 2-hour limit
    const hardCutoff = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000);
    await SensorReading.deleteMany({
      drainId,
      timestamp: { $lt: hardCutoff }
    });
  }
  
  // Clean DCI timeseries (keep 24 hours)
  await DciTimeseries.deleteMany({
    timestamp: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });
  
  // Clean health timeseries (keep 24 hours)
  await DrainHealthTimeseries.deleteMany({
    timestamp: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });
  
  console.log('✅ Cleanup complete');
};
