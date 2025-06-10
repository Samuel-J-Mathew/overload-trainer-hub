export interface Checkin {
  id: string;
  clientId: string;
  date: Date;
  weight?: number;
  bodyFat?: number;
  workoutsCompleted?: number;
  satisfactionRating?: number;
  energyLevel?: number;
  reflection?: string;
  progressPhotos?: string[];
  reviewed: boolean;
  createdAt: Date;
}
