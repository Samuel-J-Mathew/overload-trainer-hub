export interface Metric {
  id: string;
  clientId: string;
  type: 'weight' | 'body_fat' | 'steps' | 'water_intake' | 'sleep';
  value: number;
  unit: string;
  date: Date;
  memo?: string;
  createdAt: Date;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  value: number;
  date: Date;
  memo?: string;
  createdAt: Date;
}

export interface Workout {
  id: string;
  clientId: string;
  name: string;
  duration?: number;
  exercises: any[];
  totalSets?: number;
  date: Date;
  createdAt: Date;
}

export interface NutritionLog {
  id: string;
  clientId: string;
  date: Date;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  meals: any[];
  createdAt: Date;
}
