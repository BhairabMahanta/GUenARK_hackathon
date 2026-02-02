import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { SensorReading } from '../models/SensorReading';

dotenv.config();

interface SensorCSVRecord {
  timestamp: string;
  drain_id: string;
  water_level_percent: string;
  rainfall_mm_per_hour: string;
  flow_rate_lps: string;
  turbidity_ntu: string;
}

const importSensorReadings = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('📦 Connected to MongoDB');
    
    const csvData = fs.readFileSync('./src/data/sensor_readings.csv', 'utf-8');
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    }) as SensorCSVRecord[];
    
    console.log(`📦 Total records in CSV: ${records.length}`);
    
    // Only import last 5000 records (most recent data)
    const recentRecords = records.slice(-5000);
    
    console.log(`📥 Importing last ${recentRecords.length} readings...`);
    
    const batchSize = 1000;
    for (let i = 0; i < recentRecords.length; i += batchSize) {
      const batch = recentRecords.slice(i, i + batchSize).map((record) => ({
        timestamp: new Date(record.timestamp),
        drainId: parseInt(record.drain_id),
        waterLevelPercent: parseFloat(record.water_level_percent),
        rainfallMmPerHour: parseFloat(record.rainfall_mm_per_hour),
        flowRateLps: parseFloat(record.flow_rate_lps),
        turbidityNtu: parseFloat(record.turbidity_ntu)
      }));
      
      await SensorReading.insertMany(batch);
      console.log(`✅ Imported ${Math.min(i + batchSize, recentRecords.length)}/${recentRecords.length}`);
    }
    
    console.log('✅ Sensor readings imported successfully');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
};

importSensorReadings();
