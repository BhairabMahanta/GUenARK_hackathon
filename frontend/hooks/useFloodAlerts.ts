// hooks/useFloodAlerts.ts
import { useState, useEffect } from 'react';
import { floodPredictionService, FloodAlert } from '@/api/floodPrediction.service';

export const useFloodAlerts = () => {
  const [floodAlerts, setFloodAlerts] = useState<FloodAlert | null>(null);
  const [showFloodAlert, setShowFloodAlert] = useState(false);

  useEffect(() => {
    const fetchFloodAlerts = async () => {
      try {
        const alerts = await floodPredictionService.getFloodAlerts();
        setFloodAlerts(alerts);
        
        if (alerts.summary.criticalBasins > 0 || alerts.summary.criticalZones > 0) {
          setShowFloodAlert(true);
        }
      } catch (error: any) {
        if (error?.response?.status === 404) {
          console.log("Flood prediction service not available yet");
        } else {
          console.error("Failed to fetch flood alerts:", error);
        }
      }
    };

    fetchFloodAlerts();
    const interval = setInterval(fetchFloodAlerts, 120000); // Every 2 minutes

    return () => clearInterval(interval);
  }, []);

  return {
    floodAlerts,
    showFloodAlert,
    setShowFloodAlert,
  };
};
