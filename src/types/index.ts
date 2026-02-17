export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  farmName: string;
  avatar?: string;
  khasraNumber?: string;
  khataNumber?: string;
  whatsapp?: string;
  address?: string;
  language?: string;
  currency?: string;
}

export interface Field {
  id: string;
  name: string;
  area: number;
  soilType: string;
  cropStage: 'Planting' | 'Growing' | 'Flowering' | 'Fruiting' | 'Harvesting';
  healthStatus: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  location: string;
  plantedDate: string;
  latitude?: number;
  longitude?: number;
  boundaryPath?: Array<{ lat: number; lng: number }>;
}

export interface DashboardStats {
  totalFields: number;
  healthyTrees: number;
  alerts: number;
  weather: string;
}