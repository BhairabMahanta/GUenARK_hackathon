import axios from 'axios';

class AIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  async getPrediction(zoneId: string) {
    try {
      const response = await axios.post(`${this.baseUrl}/predict/flood`, {
        zoneId
      }, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('[AI] Prediction error:', error);
      throw error;
    }
  }

  async verifyPhoto(photoUrl: string) {
    try {
      const response = await axios.post(`${this.baseUrl}/verify/photo`, {
        photoUrl
      }, {
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error('[AI] Photo verification error:', error);
      throw error;
    }
  }

  async getDrainOverflowPrediction(drainId: string) {
    try {
      const response = await axios.post(`${this.baseUrl}/predict/drain-overflow`, {
        drainId
      });
      return response.data;
    } catch (error) {
      console.error('[AI] Drain overflow prediction error:', error);
      throw error;
    }
  }
}

export default new AIService();
