export interface Client {
  id: string;
  firebaseUid: string;
  name: string;
  email: string;
  tag?: string;
  lastCheckin?: Date;
  lastActive?: Date;
  duration?: string;
  goal?: string;
  injuries?: string;
  currentWeight?: number;
  goalWeight?: number;
  bodyFat?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddClientFormData {
  name: string;
  email: string;
  tag?: string;
  questionnaire?: string;
  onboarding?: string;
  setDates?: boolean;
  emailInstructions?: boolean;
}
