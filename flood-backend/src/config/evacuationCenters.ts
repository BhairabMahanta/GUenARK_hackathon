// backend/src/config/evacuationCenters.ts
export interface EvacuationCenter {
  id: string;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  facilities: string[];
}

export const EVACUATION_CENTERS: EvacuationCenter[] = [
  { 
    id: 'nehru_stadium',
    name: 'Nehru Stadium', 
    lat: 26.1445, 
    lng: 91.7362,
    capacity: 5000,
    facilities: ['medical', 'food', 'shelter']
  },
  { 
    id: 'sarusajai',
    name: 'Sarusajai Stadium', 
    lat: 26.1157, 
    lng: 91.7086,
    capacity: 8000,
    facilities: ['medical', 'food', 'shelter', 'water']
  },
  { 
    id: 'khanapara',
    name: 'Khanapara Ground', 
    lat: 26.1289, 
    lng: 91.8034,
    capacity: 3000,
    facilities: ['food', 'shelter']
  },
  { 
    id: 'gmch',
    name: 'GMCH Emergency', 
    lat: 26.1850, 
    lng: 91.7514,
    capacity: 2000,
    facilities: ['medical', 'emergency']
  },
];
