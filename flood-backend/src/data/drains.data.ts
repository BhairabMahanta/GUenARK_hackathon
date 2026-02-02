// Drain distribution based on flood severity
const DRAIN_DISTRIBUTION: Record<string, number> = {
  // Bharalu - Most critical (50 drains)
  "BHR-ZR": 10,  // Zoo Road
  "BHR-GG": 10,  // Ganeshguri
  "BHR-UL": 8,   // Ulubari
  "BHR-KP": 8,   // Kumarpara
  "BHR-BM": 7,   // Bharalumukh
  "BHR-UZ": 7,   // Uzanbazar

  // Basistha - High risk (35 drains)
  "BAS-BC": 7,   // Basistha Chariali
  "BAS-HT": 6,   // Hatigaon
  "BAS-BJ": 6,   // Barsajai
  "BAS-KN": 6,   // Khanapara
  "BAS-BL": 5,   // Beltola
  "BAS-FS": 5,   // Fatashil

  // Bahini - Medium risk (18 drains)
  "BAH-LM": 7,   // Lalmati
  "BAH-NB": 6,   // Natun Bazar
  "BAH-BC": 5,   // Basistha Chariali

  // Morabharalu - Medium risk (12 drains)
  "MBH-SM": 7,   // Sixmile
  "MBH-CB": 5,   // Christian Basti

  // Hatinala - Low risk (10 drains)
  "HTN-NG": 6,   // North Guwahati
  "HTN-PD": 4,   // Pandu

  // Silsako - Medium risk (10 drains)
  "SIL-SB": 6,   // Silsako Beel
  "SIL-BD": 4,   // Bondajan

  // Noonmati - Low risk (8 drains)
  "NON-NR": 5,   // Noonmati Refinery
  "NON-LK": 3,   // Lokhra

  // Dipor Beel - Low risk (10 drains - wetland drainage)
  "DPR-DW": 6,   // Dipor Beel Wetland
  "DPR-PC": 4    // Pamohi Channel
};

// ✅ Helper to calculate capacity from dimensions
function calculateCapacity(
  depth_cm: number,
  width_cm: number,
  drain_type: 'rectangular' | 'circular' | 'trapezoidal'
): number {
  const length_cm = 100; // Assume 1 meter length

  if (drain_type === 'rectangular') {
    // Volume = depth × width × length (in cm³ → liters)
    return (depth_cm * width_cm * length_cm) / 1000;
  } else if (drain_type === 'circular') {
    // Volume = π × r² × length (width_cm = diameter)
    const radius_cm = width_cm / 2;
    return (Math.PI * radius_cm * radius_cm * length_cm) / 1000;
  } else if (drain_type === 'trapezoidal') {
    // Simplified: average of top and bottom widths
    const avgWidth = width_cm * 0.8; // Assume 80% avg
    return (depth_cm * avgWidth * length_cm) / 1000;
  }

  return 0;
}

// Helper function to generate drains
function generateDrainsForZone(
  zoneCode: string,
  zoneName: string,
  basin: string,
  bounds: [number, number, number, number],
  count: number
) {
  const drains = [];
  const [minLng, minLat, maxLng, maxLat] = bounds;

  for (let i = 1; i <= count; i++) {
    const drainNumber = String(i).padStart(3, '0');
    const drainCode = `${zoneCode}-${drainNumber}`;

    // Random location within zone boundary
    const lng = minLng + Math.random() * (maxLng - minLng);
    const lat = minLat + Math.random() * (maxLat - minLat);

    // Random drain specifications
    const drainTypes = ['rectangular', 'circular', 'trapezoidal'] as const;
    const drainType = drainTypes[Math.floor(Math.random() * 3)];

    const depth_cm = 30 + Math.random() * 70;  // 30-100 cm
    const width_cm = 30 + Math.random() * 70;  // 30-100 cm

    // ✅ Calculate capacity upfront
    const capacity = calculateCapacity(depth_cm, width_cm, drainType);
    const blockageFactor = Math.random() * 0.4; // 0-40% blocked
    const effectiveCapacity = capacity * (1 - blockageFactor);

    drains.push({
      drainCode,
      name: `${zoneName} Drain ${i}`,
      location: {
        type: 'Point' as const,
        coordinates: [lng, lat]
      },
      basin,
      dimensions: {
        depth_cm,
        width_cm,
        drain_type: drainType
      },
      // ✅ Include calculated fields
      capacity,
      effectiveCapacity,
      // Initial state (realistic variation)
      currentWaterLevel: Math.random() * 40,  // 0-40%
      blockageFactor,
      inflowRate: 0,
      outflowRate: 0,
      timeToFill: null,
      stressIndex: 0,
      status: 'safe' as const
    });
  }

  return drains;
}

// Import zone data
import { GUWAHATI_ZONES } from './zones.data';

// Generate all drains
export const GUWAHATI_DRAINS = GUWAHATI_ZONES.flatMap(zone => {
  const count = DRAIN_DISTRIBUTION[zone.zoneCode] || 5;
  const bounds = zone.boundary.coordinates[0];
  const [minLng, minLat] = bounds[0];
  const [maxLng, maxLat] = bounds[2];

  return generateDrainsForZone(
    zone.zoneCode,
    zone.name,
    zone.basin,
    [minLng, minLat, maxLng, maxLat],
    count
  );
});

// Total: 153 drains across 25 zones
