import { execSync } from 'child_process';

const scripts = [
  'import-drains.ts',
  'import-sensor-readings.ts',
  'import-dci-timeseries.ts',
  'import-health-timeseries.ts'
];

console.log('🚀 Starting full import...\n');

for (const script of scripts) {
  console.log(`\n▶️  Running ${script}...`);
  try {
    execSync(`npx ts-node src/scripts/${script}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`❌ Failed to run ${script}`);
    process.exit(1);
  }
}

console.log('\n✅ All imports completed!');
