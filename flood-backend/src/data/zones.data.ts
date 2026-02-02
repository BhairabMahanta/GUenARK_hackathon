// Real Guwahati coordinates for each zone
// Format: [minLng, minLat, maxLng, maxLat] - bounding box for each area

const ZONE_COORDINATES: Record<string, [number, number, number, number]> = {
  // Bharalu Basin (Central Guwahati - most critical)
  "Zoo_Road": [91.7850, 26.1750, 91.7950, 26.1850],
  "Ganeshguri": [91.7750, 26.1650, 91.7850, 26.1750],
  "Ulubari": [91.7650, 26.1650, 91.7750, 26.1750],
  "Kumarpara": [91.7550, 26.1550, 91.7650, 26.1650],
  "Bharalumukh": [91.7400, 26.1700, 91.7500, 26.1800],
  "Uzanbazar": [91.7500, 26.1800, 91.7600, 26.1900],

  // Basistha Basin (South Guwahati)
  "Basistha_Chariali": [91.8000, 26.1400, 91.8100, 26.1500],
  "Hatigaon": [91.7900, 26.1600, 91.8000, 26.1700],
  "Barsajai": [91.8100, 26.1300, 91.8200, 26.1400],
  "Khanapara": [91.7900, 26.1400, 91.8000, 26.1500],
  "Beltola": [91.7800, 26.1300, 91.7900, 26.1400],
  "Fatashil": [91.8000, 26.1200, 91.8100, 26.1300],

  // Bahini Basin
  "Lalmati": [91.7200, 26.1650, 91.7300, 26.1750],
  "Natun_Bazar": [91.7300, 26.1600, 91.7400, 26.1700],

  // Morabharalu Basin
  "Sixmile": [91.7100, 26.1900, 91.7200, 26.2000],
  "Christian_Basti": [91.7650, 26.1850, 91.7750, 26.1950],

  // Hatinala Basin (North Guwahati)
  "North_Guwahati": [91.7000, 26.2050, 91.7200, 26.2200],
  "Pandu": [91.6900, 26.1900, 91.7000, 26.2000],

  // Silsako Basin
  "Silsako_Beel": [91.7900, 26.1700, 91.8000, 26.1800],
  "Bondajan": [91.8000, 26.1650, 91.8100, 26.1750],

  // Noonmati Basin
  "Noonmati_Refinery": [91.8200, 26.1550, 91.8350, 26.1650],
  "Lokhra": [91.8350, 26.1500, 91.8500, 26.1600],

  // Dipor Beel Basin (West Guwahati - wetland area)
  "Dipor_Beel_Wetland": [91.6500, 26.1350, 91.6700, 26.1500],
  "Pamohi_Channel": [91.6700, 26.1400, 91.6850, 26.1550]
};

// Helper to create GeoJSON polygon from bounding box
function createPolygon(coords: [number, number, number, number]) {
  const [minLng, minLat, maxLng, maxLat] = coords;
  return {
    type: "Polygon" as const,
    coordinates: [[
      [minLng, minLat],
      [maxLng, minLat],
      [maxLng, maxLat],
      [minLng, maxLat],
      [minLng, minLat] // Close the polygon
    ]]
  };
}

// Generate zone data
export const GUWAHATI_ZONES = [
  // ========== BHARALU BASIN (6 zones) ==========
  {
    zoneCode: "BHR-ZR",
    name: "Zoo Road",
    basin: "Bharalu",
    boundary: createPolygon(ZONE_COORDINATES["Zoo_Road"])
  },
  {
    zoneCode: "BHR-GG",
    name: "Ganeshguri",
    basin: "Bharalu",
    boundary: createPolygon(ZONE_COORDINATES["Ganeshguri"])
  },
  {
    zoneCode: "BHR-UL",
    name: "Ulubari",
    basin: "Bharalu",
    boundary: createPolygon(ZONE_COORDINATES["Ulubari"])
  },
  {
    zoneCode: "BHR-KP",
    name: "Kumarpara",
    basin: "Bharalu",
    boundary: createPolygon(ZONE_COORDINATES["Kumarpara"])
  },
  {
    zoneCode: "BHR-BM",
    name: "Bharalumukh",
    basin: "Bharalu",
    boundary: createPolygon(ZONE_COORDINATES["Bharalumukh"])
  },
  {
    zoneCode: "BHR-UZ",
    name: "Uzanbazar",
    basin: "Bharalu",
    boundary: createPolygon(ZONE_COORDINATES["Uzanbazar"])
  },

  // ========== BASISTHA BASIN (6 zones) ==========
  {
    zoneCode: "BAS-BC",
    name: "Basistha Chariali",
    basin: "Basistha",
    boundary: createPolygon(ZONE_COORDINATES["Basistha_Chariali"])
  },
  {
    zoneCode: "BAS-HT",
    name: "Hatigaon",
    basin: "Basistha",
    boundary: createPolygon(ZONE_COORDINATES["Hatigaon"])
  },
  {
    zoneCode: "BAS-BJ",
    name: "Barsajai",
    basin: "Basistha",
    boundary: createPolygon(ZONE_COORDINATES["Barsajai"])
  },
  {
    zoneCode: "BAS-KN",
    name: "Khanapara",
    basin: "Basistha",
    boundary: createPolygon(ZONE_COORDINATES["Khanapara"])
  },
  {
    zoneCode: "BAS-BL",
    name: "Beltola",
    basin: "Basistha",
    boundary: createPolygon(ZONE_COORDINATES["Beltola"])
  },
  {
    zoneCode: "BAS-FS",
    name: "Fatashil",
    basin: "Basistha",
    boundary: createPolygon(ZONE_COORDINATES["Fatashil"])
  },

  // ========== BAHINI BASIN (3 zones) ==========
  {
    zoneCode: "BAH-LM",
    name: "Lalmati",
    basin: "Bahini",
    boundary: createPolygon(ZONE_COORDINATES["Lalmati"])
  },
  {
    zoneCode: "BAH-NB",
    name: "Natun Bazar",
    basin: "Bahini",
    boundary: createPolygon(ZONE_COORDINATES["Natun_Bazar"])
  },
  {
    zoneCode: "BAH-BC",
    name: "Basistha Chariali (Bahini)",
    basin: "Bahini",
    boundary: createPolygon(ZONE_COORDINATES["Basistha_Chariali"])
  },

  // ========== MORABHARALU BASIN (2 zones) ==========
  {
    zoneCode: "MBH-SM",
    name: "Sixmile",
    basin: "Morabharalu",
    boundary: createPolygon(ZONE_COORDINATES["Sixmile"])
  },
  {
    zoneCode: "MBH-CB",
    name: "Christian Basti",
    basin: "Morabharalu",
    boundary: createPolygon(ZONE_COORDINATES["Christian_Basti"])
  },

  // ========== HATINALA BASIN (2 zones) ==========
  {
    zoneCode: "HTN-NG",
    name: "North Guwahati",
    basin: "Hatinala",
    boundary: createPolygon(ZONE_COORDINATES["North_Guwahati"])
  },
  {
    zoneCode: "HTN-PD",
    name: "Pandu",
    basin: "Hatinala",
    boundary: createPolygon(ZONE_COORDINATES["Pandu"])
  },

  // ========== SILSAKO BASIN (2 zones) ==========
  {
    zoneCode: "SIL-SB",
    name: "Silsako Beel",
    basin: "Silsako",
    boundary: createPolygon(ZONE_COORDINATES["Silsako_Beel"])
  },
  {
    zoneCode: "SIL-BD",
    name: "Bondajan",
    basin: "Silsako",
    boundary: createPolygon(ZONE_COORDINATES["Bondajan"])
  },

  // ========== NOONMATI BASIN (2 zones) ==========
  {
    zoneCode: "NON-NR",
    name: "Noonmati Refinery",
    basin: "Noonmati",
    boundary: createPolygon(ZONE_COORDINATES["Noonmati_Refinery"])
  },
  {
    zoneCode: "NON-LK",
    name: "Lokhra",
    basin: "Noonmati",
    boundary: createPolygon(ZONE_COORDINATES["Lokhra"])
  },

  // ========== DIPOR BEEL BASIN (2 zones) ==========
  {
    zoneCode: "DPR-DW",
    name: "Dipor Beel Wetland",
    basin: "Dipor_Beel",
    boundary: createPolygon(ZONE_COORDINATES["Dipor_Beel_Wetland"])
  },
  {
    zoneCode: "DPR-PC",
    name: "Pamohi Channel",
    basin: "Dipor_Beel",
    boundary: createPolygon(ZONE_COORDINATES["Pamohi_Channel"])
  }
];

// Total: 27 zones across 8 basins
