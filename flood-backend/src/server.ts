import express, { Application } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import mqttService from './services/mqtt.service';
import socketService from './services/socket.service';
import simulatorService from './services/simulator.service';
import dataCleanupService from './services/dataCleanup.service';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes/index';
import { ClientToServerEvents, ServerToClientEvents } from './types/socket.types';
import { connectDB } from './config/database';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);

// Initialize Socket.IO with types
const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: '*' }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static dashboard
app.use(express.static('public'));

// API Routes
app.use('/', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    service: 'flood-backend',
    simulator: process.env.ENABLE_SIMULATOR === 'true' ? 'enabled' : 'disabled'
  });
});

app.get('/api/floods/test', (req, res) => {
  res.json({ message: 'Flood API is working!' });
});

// Error handling - must be last
app.use(errorHandler);

// ============================================
// SIMULATOR CONFIGURATION
// ============================================

const ENABLE_SIMULATOR = process.env.ENABLE_SIMULATOR !== 'false'; // Default: enabled
const SIMULATOR_INTERVAL_MS = parseInt(process.env.SIMULATOR_INTERVAL_MS || '120000'); // Default: 2 minutes

let simulatorInterval: NodeJS.Timeout | null = null;

/**
 * Schedule realistic weather pattern changes
 */
const scheduleWeatherChanges = () => {
  // After 10 minutes → heavy rain
  setTimeout(() => {
    console.log('\n⚠️  [SIMULATOR] WEATHER CHANGE: Heavy rain starting...\n');
    simulatorService.setWeatherMode('heavy_rain');
  }, 10 * 60 * 1000);

  // After 30 minutes → back to normal
  setTimeout(() => {
    console.log('\n🌤️  [SIMULATOR] WEATHER CHANGE: Returning to normal...\n');
    simulatorService.setWeatherMode('normal');
  }, 30 * 60 * 1000);

  // After 45 minutes → extreme event
  setTimeout(() => {
    console.log('\n🚨 [SIMULATOR] WEATHER CHANGE: EXTREME EVENT!\n');
    simulatorService.setWeatherMode('extreme');
  }, 45 * 60 * 1000);

  // After 60 minutes → loop back to normal
  setTimeout(() => {
    console.log('\n🌤️  [SIMULATOR] WEATHER CHANGE: Back to normal (cycle restart)\n');
    simulatorService.setWeatherMode('normal');
    
    // Restart the weather cycle
    scheduleWeatherChanges();
  }, 60 * 60 * 1000);
};

/**
 * Start the automatic simulator
 */
const startSimulator = () => {
  if (!ENABLE_SIMULATOR) {
    console.log('[SIMULATOR] Disabled (set ENABLE_SIMULATOR=true to enable)');
    return;
  }

  console.log('[SIMULATOR] Starting automatic sensor simulation...');
  console.log(`[SIMULATOR] Interval: ${SIMULATOR_INTERVAL_MS / 60000} minutes`);

  // Initial round after 10 seconds (give server time to fully start)
  setTimeout(() => {
    console.log('[SIMULATOR] Running initial simulation round...');
    simulatorService.generateRound()
      .catch(err => console.error('[SIMULATOR] ❌ Initial simulation failed:', err));
  }, 10000);

  // Schedule regular intervals
  simulatorInterval = setInterval(() => {
    simulatorService.generateRound()
      .catch(err => console.error('[SIMULATOR] ❌ Simulation error:', err));
  }, SIMULATOR_INTERVAL_MS);

  // Schedule weather pattern changes
  scheduleWeatherChanges();

  console.log('[SIMULATOR] ✅ Automatic simulation enabled\n');
};

// ============================================
// DATA CLEANUP CONFIGURATION
// ============================================

const CLEANUP_INTERVAL_MS = parseInt(process.env.CLEANUP_INTERVAL_MS || '300000'); // Default: 5 minutes

let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Start automatic data cleanup
 */
const startDataCleanup = () => {
  console.log('[CLEANUP] Starting automatic cleanup...');
  console.log(`[CLEANUP] Interval: ${CLEANUP_INTERVAL_MS / 60000} minutes\n`);

  // Run initial cleanup after 30 seconds
  setTimeout(() => {
    dataCleanupService.cleanupAll()
      .catch(err => console.error('[CLEANUP] ❌ Error:', err));
  }, 30000);

  // Schedule regular cleanups
  cleanupInterval = setInterval(() => {
    dataCleanupService.cleanupAll()
      .catch(err => console.error('[CLEANUP] ❌ Error:', err));
  }, CLEANUP_INTERVAL_MS);
};

// ============================================
// INITIALIZE SERVICES AND START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize Socket.IO service
    socketService.initialize(io);
    
    // Initialize MQTT service
    mqttService.initialize();
    
    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`[SERVER] Running on port ${PORT}`);
      console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[SERVER] API: http://localhost:${PORT}\n`);
      
      // Start simulator after server is ready
      startSimulator();
      
      // Start data cleanup
      startDataCleanup();
    });
  } catch (error) {
    console.error('[SERVER] Failed to start:', error);
    process.exit(1);
  }
};

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGTERM', () => {
  console.log('\n[SERVER] SIGTERM received, shutting down gracefully');
  
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    console.log('[SIMULATOR] Stopped');
  }

  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    console.log('[CLEANUP] Stopped');
  }
  
  mqttService.disconnect();
  
  httpServer.close(() => {
    console.log('[SERVER] Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('\n\n[SERVER] SIGINT received, shutting down gracefully');
  
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    console.log('[SIMULATOR] Stopped');
  }

  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    console.log('[CLEANUP] Stopped');
  }
  
  mqttService.disconnect();
  
  httpServer.close(() => {
    console.log('[SERVER] Process terminated');
    process.exit(0);
  });
});

startServer();

export { io };
