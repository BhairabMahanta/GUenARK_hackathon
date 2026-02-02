// routes/sensor.routes.ts (COMPLETE WITH CLEANUP)
import { Router } from 'express';
import sensorController from '../controllers/sensor.controller';
import processSensorReadingService from '../services/processSensorReading.service';
import simulatorService from '../services/simulator.service';
import dataCleanupService from '../services/dataCleanup.service';

const router = Router();

// ============================================
// EXISTING ROUTES (from your controller)
// ============================================

// Get readings for a specific drain
router.get('/drain/:drainId', sensorController.getDrainReadings);

// Get reading stats for a drain
router.get('/drain/:drainId/stats', sensorController.getReadingStats);

// Get all latest readings (for map)
router.get('/latest', sensorController.getAllLatestReadings);

// Get latest readings for multiple drains
router.get('/latest/multiple', sensorController.getLatestReadings);

// Get basin aggregate
router.get('/basin/:basinId/aggregate', sensorController.getBasinAggregate);

// Save new reading (for testing) - KEEP YOUR EXISTING ONE
router.post('/readings', sensorController.saveSensorReading);

// ============================================
// NEW ROUTES (Processing Pipeline)
// ============================================

/**
 * POST /api/sensors/process
 * Process a sensor reading through the full DCI pipeline
 */
router.post('/process', async (req, res) => {
  try {
    const {
      drainId,
      waterLevelPercent,
      rainfallMmPerHour,
      flowRateLps,
      turbidityNtu,
      metadata
    } = req.body;

    // Validation
    if (!drainId || waterLevelPercent === undefined) {
      return res.status(400).json({ error: 'Missing required fields: drainId, waterLevelPercent' });
    }

    const result = await processSensorReadingService.processSensorReading(
      drainId,
      waterLevelPercent,
      rainfallMmPerHour || 0,
      flowRateLps || 0,
      turbidityNtu || 0,
      metadata
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('Error processing sensor reading:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/sensors/simulate
 * Trigger simulation round for all drains
 */
router.post('/simulate', async (req, res) => {
  try {
    const { weatherMode, affectedZones } = req.body;

    // Run async (don't wait for completion)
    simulatorService.generateRound({
      weatherMode: weatherMode || 'normal',
      affectedZones
    }).catch(err => console.error('Simulation error:', err));

    res.json({
      success: true,
      message: 'Simulation round started'
    });

  } catch (error: any) {
    console.error('Error running simulation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/sensors/weather
 * Change weather mode for simulator
 */
router.post('/weather', async (req, res) => {
  try {
    const { mode } = req.body;

    if (!['normal', 'heavy_rain', 'extreme'].includes(mode)) {
      return res.status(400).json({ 
        error: 'Invalid weather mode. Use: normal, heavy_rain, or extreme' 
      });
    }

    simulatorService.setWeatherMode(mode);

    res.json({
      success: true,
      message: `Weather mode changed to: ${mode}`
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DATA CLEANUP ROUTES
// ============================================

/**
 * GET /api/sensors/stats/storage
 * Get storage statistics for all collections
 */
router.get('/stats/storage', async (req, res) => {
  try {
    const stats = await dataCleanupService.getStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error getting storage stats:', error);
    res.status(500).json({ error: error.message });
  }
});
router.get('/drain/:drainId/history', async (req, res) => {
  try {
    const { drainId } = req.params;
    const { limit = 100 } = req.query;

    // Direct MongoDB query
    const mongoose = require('mongoose');
    const db = mongoose.connection;
    
    const history = await db.collection('drainhealthtimeseries')
      .find({ drainId: parseInt(drainId) })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string))
      .toArray();

    // Reverse to get chronological order (oldest to newest)
    history.reverse();

    res.json({
      success: true,
      count: history.length,
      data: history
    });

  } catch (error: any) {
    console.error('Error fetching drain history:', error);
    res.status(500).json({ error: error.message });
  }
});


/**
 * POST /api/sensors/cleanup
 * Manually trigger cleanup (for testing/maintenance)
 */
router.post('/cleanup', async (req, res) => {
  try {
    await dataCleanupService.cleanupAll();
    const stats = await dataCleanupService.getStats();
    
    res.json({ 
      success: true, 
      message: 'Cleanup completed successfully',
      stats 
    });
  } catch (error: any) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
