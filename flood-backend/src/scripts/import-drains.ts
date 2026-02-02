import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { Drain } from '../models/Drain';

dotenv.config();
interface DrainCSVRecord {
  drain_id: string;
  basin_id: string;
  zone_id: string;
  depth_cm: string;
  width_cm: string;
  latitude: string;
  longitude: string;
  drain_type: string;
  vulnerability_factor: string;
}

const importDrains = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('📦 Connected to MongoDB');
    
    const csvData = fs.readFileSync('./src/data/drain_metadata.csv', 'utf-8');
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`📥 Importing ${records.length} drains...`);
    
    for (const record of records as DrainCSVRecord[]) {
      await Drain.findOneAndUpdate(
        { drainId: parseInt(record.drain_id) },
        {
          drainId: parseInt(record.drain_id),
          basinId: record.basin_id,
          zoneId: record.zone_id,
          location: {
            type: 'Point',
            coordinates: [parseFloat(record.longitude), parseFloat(record.latitude)]
          },
          dimensions: {
            depthCm: parseFloat(record.depth_cm),
            widthCm: parseFloat(record.width_cm),
            drainType: record.drain_type
          },
          vulnerabilityFactor: parseFloat(record.vulnerability_factor),
          status: 'offline',
          currentMetrics: {
            dci: 0,
            dciEff: 0,
            degradationRateHr: null,
            timeToFailureHr: null,
            riskLevel: 'NORMAL',
            lEff: 0,
            bEff: 0,
            fEff: 0
          },
          currentWaterLevel: 0,
          effectiveCapacity: 0,
          stressIndex: 0
        },
        { upsert: true }
      );
    }
    
    console.log('✅ Drains imported successfully');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
};

importDrains();
