// services/dataCleanup.service.ts
import mongoose from 'mongoose';
import { SensorReading } from '../models/SensorReading';
import { DciTimeseries } from '../models/DciTimeseries';
import { DrainHealthTimeseries } from '../models/DrainHealthTimeseries';

class DataCleanupService {
  // Configuration
  private readonly MAX_DOCUMENTS = {
    sensorReadings: 10000,
    dciTimeseries: 10000,
    drainHealthTimeseries: 10000
  };

  /**
   * Clean all time-series collections
   */
  async cleanupAll(): Promise<void> {
    console.log('\n🧹 [CLEANUP] Starting data cleanup...');
    
    const results = await Promise.all([
      this.cleanupCollection('sensorReadings', SensorReading, this.MAX_DOCUMENTS.sensorReadings),
      this.cleanupCollection('dciTimeseries', DciTimeseries, this.MAX_DOCUMENTS.dciTimeseries),
      this.cleanupCollection('drainHealthTimeseries', DrainHealthTimeseries, this.MAX_DOCUMENTS.drainHealthTimeseries)
    ]);

    const totalDeleted = results.reduce((sum, r) => sum + r.deleted, 0);
    console.log(`🧹 [CLEANUP] Complete. Total deleted: ${totalDeleted} documents\n`);
  }

  /**
   * Clean a single collection (keep only last N documents)
   */
  private async cleanupCollection(
    name: string,
    model: any,
    maxDocuments: number
  ): Promise<{ deleted: number }> {
    try {
      // Count total documents
      const totalCount = await model.countDocuments();

      if (totalCount <= maxDocuments) {
        console.log(`✅ [CLEANUP] ${name}: ${totalCount}/${maxDocuments} - No cleanup needed`);
        return { deleted: 0 };
      }

      // Calculate how many to delete
      const toDelete = totalCount - maxDocuments;

      // Find oldest documents (by timestamp)
      const oldestDocs = await model
        .find({})
        .sort({ timestamp: 1 }) // Ascending (oldest first)
        .limit(toDelete)
        .select('_id')
        .lean();

      const idsToDelete = oldestDocs.map((doc: any) => doc._id);

      // Delete them
      const result = await model.deleteMany({
        _id: { $in: idsToDelete }
      });

      console.log(`🗑️  [CLEANUP] ${name}: Deleted ${result.deletedCount}/${toDelete} old documents (kept ${maxDocuments})`);

      return { deleted: result.deletedCount || 0 };

    } catch (error) {
      console.error(`❌ [CLEANUP] Error cleaning ${name}:`, error);
      return { deleted: 0 };
    }
  }

  /**
   * Get collection statistics
   */
  async getStats() {
    const [sensorCount, dciCount, healthCount] = await Promise.all([
      SensorReading.countDocuments(),
      DciTimeseries.countDocuments(),
      DrainHealthTimeseries.countDocuments()
    ]);

    return {
      sensorReadings: {
        count: sensorCount,
        max: this.MAX_DOCUMENTS.sensorReadings,
        usage: ((sensorCount / this.MAX_DOCUMENTS.sensorReadings) * 100).toFixed(1) + '%'
      },
      dciTimeseries: {
        count: dciCount,
        max: this.MAX_DOCUMENTS.dciTimeseries,
        usage: ((dciCount / this.MAX_DOCUMENTS.dciTimeseries) * 100).toFixed(1) + '%'
      },
      drainHealthTimeseries: {
        count: healthCount,
        max: this.MAX_DOCUMENTS.drainHealthTimeseries,
        usage: ((healthCount / this.MAX_DOCUMENTS.drainHealthTimeseries) * 100).toFixed(1) + '%'
      },
      total: sensorCount + dciCount + healthCount
    };
  }
}

export default new DataCleanupService();
