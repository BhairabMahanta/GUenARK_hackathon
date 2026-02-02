// backend/src/scripts/import-dci-timeseries.ts
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

dotenv.config();

interface DciCSVRecord {
  timestamp: string;
  drain_id: string;
  DCI: string;
  L_eff: string;
  B_eff: string;
  F_eff: string;
}

const importDciTimeseries = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('📦 Connected to MongoDB');
    
    const csvData = fs.readFileSync('./src/data/dci_timeseries.csv', 'utf-8');
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    }) as DciCSVRecord[];
    
    console.log(`📦 Total records in CSV: ${records.length}`);
    
    // Group by drain_id
    const drainGroups = records.reduce((acc, record) => {
      const drainId = parseInt(record.drain_id);
      if (!acc[drainId]) acc[drainId] = [];
      acc[drainId].push(record);
      return acc;
    }, {} as Record<number, DciCSVRecord[]>);
    
    const uniqueDrainIds = Object.keys(drainGroups).map(Number);
    console.log(`📊 Unique drains in CSV: ${uniqueDrainIds.length}`);
    
    // Take last 35 records per drain (35 * 143 ≈ 5000 total)
    const recordsPerDrain = 35;
    const recentRecords: DciCSVRecord[] = [];
    
    for (const drainId of uniqueDrainIds) {
      const drainRecords = drainGroups[drainId];
      const lastRecords = drainRecords.slice(-recordsPerDrain);
      recentRecords.push(...lastRecords);
    }
    
    console.log(`📥 Importing ${recentRecords.length} DCI records (${recordsPerDrain} per drain)...`);
    
    // Clear existing collection
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    await db.collection('dcitimeseries').deleteMany({});
    console.log('🗑️  Cleared existing DCI data');
    
    const batchSize = 1000;
    for (let i = 0; i < recentRecords.length; i += batchSize) {
      const batch = recentRecords.slice(i, i + batchSize).map((record) => {
        const lEff = parseFloat(record.L_eff);
        const bEff = parseFloat(record.B_eff);
        const fEff = parseFloat(record.F_eff);
        
        // Calculate dcfEff as geometric mean of components
        const dcfEff = Math.pow(lEff * bEff * fEff, 1/3);
        
        return {
          timestamp: new Date(record.timestamp),
          drainId: parseInt(record.drain_id),
          dci: parseFloat(record.DCI),
          lEff,
          bEff,
          fEff,
          dcfEff
        };
      });
      
      await db.collection('dcitimeseries').insertMany(batch);
      console.log(`✅ Imported ${Math.min(i + batchSize, recentRecords.length)}/${recentRecords.length}`);
    }
    
    // Verify import
    const importedCount = await db.collection('dcitimeseries').countDocuments();
    const uniqueImportedDrains = await db
      .collection('dcitimeseries')
      .distinct('drainId') as number[];
    
    console.log(`\n📊 Import Summary:`);
    console.log(`   Total documents: ${importedCount}`);
    console.log(`   Unique drains: ${uniqueImportedDrains.length}`);
    console.log(`   Expected drains: 143`);
    
    if (uniqueImportedDrains.length < 143) {
      console.log(`   ⚠️ WARNING: Only ${uniqueImportedDrains.length}/143 drains have DCI data!`);
      const missingDrains = Array.from({length: 143}, (_, i) => i + 1)
        .filter(id => !uniqueImportedDrains.includes(id));
      console.log(`   Missing drain IDs: ${missingDrains.slice(0, 10).join(', ')}${missingDrains.length > 10 ? '...' : ''}`);
    } else {
      console.log(`   ✅ All 143 drains have DCI data!`);
    }
    
    // Show sample of imported data per drain
    console.log(`\n📈 Sample records per drain:`);
    for (const drainId of uniqueImportedDrains.slice(0, 5)) {
      const count = await db.collection('dcitimeseries').countDocuments({ drainId });
      console.log(`   Drain ${drainId}: ${count} records`);
    }
    
    console.log('\n✅ DCI timeseries imported successfully');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
};

importDciTimeseries();
