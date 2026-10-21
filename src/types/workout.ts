export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure';

export type MuscleGroup = 
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Biceps'
  | 'Triceps'
  | 'Core'
  | 'Calves'
  | 'Full Body'
  | 'Cardio';

export interface WorkoutSet {
  index: number;
  type: SetType;
  weightKg: number;
  weightLbs: number;
  reps: number;
  distanceKm?: number;
  distanceMiles?: number;
  durationSeconds?: number;
  rpe?: number;
  estimated1RMKg: number;
  estimated1RMLbs: number;
  volumeKg: number;
  volumeLbs: number;
  isPR?: boolean;
}

export interface WorkoutExercise {
  exerciseTitle: string;
  notes?: string;
  supersetId?: number;
  sets: WorkoutSet[];
  muscleGroup: MuscleGroup;
  secondaryMuscle?: MuscleGroup;
  totalVolumeKg: number;
  totalVolumeLbs: number;
  bestSet1RMKg: number;
  bestSet1RMLbs: number;
  bestSetWeightKg: number;
  bestSetWeightLbs: number;
  maxReps: number;
}

export interface Workout {
  id: string;
  title: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes: number;
  description?: string;
  exercises: WorkoutExercise[];
  totalVolumeKg: number;
  totalVolumeLbs: number;
  totalSets: number;
  totalReps: number;
  primaryMuscles: MuscleGroup[];
}

export interface ExerciseDataPoint {
  date: Date;
  workoutTitle: string;
  workoutId: string;
  bestWeightKg: number;
  bestWeightLbs: number;
  bestReps: number;
  estimated1RMKg: number;
  estimated1RMLbs: number;
  totalVolumeKg: number;
  totalVolumeLbs: number;
  totalSets: number;
}

export interface ExerciseStats {
  exerciseTitle: string;
  muscleGroup: MuscleGroup;
  secondaryMuscle?: MuscleGroup;
  totalSets: number;
  totalReps: number;
  totalLifetimeVolumeKg: number;
  totalLifetimeVolumeLbs: number;
  allTimeMaxWeightKg: number;
  allTimeMaxWeightLbs: number;
  allTimeEstimated1RMKg: number;
  allTimeEstimated1RMLbs: number;
  repMaxRecords: {
    oneRM?: { weightKg: number; weightLbs: number; reps: number; date: Date };
    threeRM?: { weightKg: number; weightLbs: number; reps: number; date: Date };
    fiveRM?: { weightKg: number; weightLbs: number; reps: number; date: Date };
    eightRM?: { weightKg: number; weightLbs: number; reps: number; date: Date };
    tenRM?: { weightKg: number; weightLbs: number; reps: number; date: Date };
  };
  firstPerformed: Date;
  lastPerformed: Date;
  history: ExerciseDataPoint[];
}

export type UnitPreference = 'kg' | 'lbs';

export interface DatasetInfo {
  id: string;
  name: string;
  description: string;
  filename: string;
  workoutCount: number;
  dateRange: string;
  isCustom?: boolean;
}
