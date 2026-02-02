// backend/src/routes/flood.routes.ts
import { Router } from 'express';
import { floodPredictionService } from '../services/floodPrediction.service';

const router = Router();

router.get('/alerts', async (req, res) => {
  try {
    // Get zone predictions and basin predictions
    const zonePredictions = await floodPredictionService.predictZoneFlooding();
    const basinPredictions = await floodPredictionService.predictBasinFlooding();
    const evacuationRoutes = await floodPredictionService.generateEvacuationRoutes();
    
    // Build summary from predictions
    const summary = {
      criticalZones: zonePredictions.filter((z: any) => z.riskLevel === 'CRITICAL').length,
      totalZonesAtRisk: zonePredictions.filter((z: any) => z.riskLevel !== 'NORMAL').length,
      criticalBasins: basinPredictions.filter((b: any) => b.riskLevel === 'CRITICAL').length,
      activeEvacuationRoutes: evacuationRoutes.length
    };
    
    res.json({
      success: true,
      summary,
      zones: zonePredictions,
      basins: basinPredictions,
      evacuationRoutes,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching flood alerts:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch flood alerts' 
    });
  }
});

// Get zone predictions
router.get('/zones', async (req, res) => {
  try {
    const predictions = await floodPredictionService.predictZoneFlooding();
    res.json(predictions);
  } catch (error) {
    console.error('Error predicting zone flooding:', error);
    res.status(500).json({ error: 'Failed to predict zone flooding' });
  }
});

// Get basin predictions
router.get('/basins', async (req, res) => {
  try {
    const predictions = await floodPredictionService.predictBasinFlooding();
    res.json(predictions);
  } catch (error) {
    console.error('Error predicting basin flooding:', error);
    res.status(500).json({ error: 'Failed to predict basin flooding' });
  }
});

// Get evacuation routes
router.get('/evacuation-routes', async (req, res) => {
  try {
    const routes = await floodPredictionService.generateEvacuationRoutes();
    res.json(routes);
  } catch (error) {
    console.error('Error generating evacuation routes:', error);
    res.status(500).json({ error: 'Failed to generate evacuation routes' });
  }
});

export default router;
