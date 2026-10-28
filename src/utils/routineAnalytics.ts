import { MuscleGroup, Workout, WorkoutSet } from '../types/workout';

export interface RoutineExercise {
  title: string;
  muscleGroup: MuscleGroup;
  appearances: number;
  sets: number;
  reps: number;
  weightKg: number;
  weightLbs: number;
  bestWeightKg: number;
  bestWeightLbs: number;
}

export interface RoutineVariant {
  id: string;
  sessions: number;
  firstPerformed: Date;
  lastPerformed: Date;
  avgDurationMinutes: number;
  avgVolumeKg: number;
  avgVolumeLbs: number;
  exercises: RoutineExercise[];
  primaryMuscles: MuscleGroup[];
}

export interface Routine {
  id: string;
  name: string;
  sessions: number;
  firstPerformed: Date;
  lastPerformed: Date;
  avgDurationMinutes: number;
  avgVolumeKg: number;
  avgVolumeLbs: number;
  variants: RoutineVariant[];
  primaryMuscles: MuscleGroup[];
}

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const hash = (value: string): string => {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (Math.imul(h, 31) + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
};

const compositionKey = (workout: Workout): string =>
  [...new Set(workout.exercises.map(ex => ex.exerciseTitle.trim().toLowerCase()))]
    .sort()
    .join('|');

const isWorkingSet = (set: WorkoutSet): boolean => set.type !== 'warmup' && set.reps > 0;

const topMuscles = (exercises: RoutineExercise[]): MuscleGroup[] => {
  const counts = new Map<MuscleGroup, number>();
  exercises.forEach(exercise => {
    counts.set(exercise.muscleGroup, (counts.get(exercise.muscleGroup) ?? 0) + exercise.appearances);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([muscle]) => muscle);
};

const mean = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

const normalizeTitle = (title: string): string => title.trim().replace(/\s+/g, ' ');

const commonTitle = (sessions: Workout[]): string => {
  const counts = new Map<string, number>();
  sessions.forEach(workout => {
    const title = normalizeTitle(workout.title);
    counts.set(title, (counts.get(title) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
};

interface ExerciseAggregate {
  title: string;
  muscleGroup: MuscleGroup;
  appearances: number;
  orderSum: number;
  orderCount: number;
  sets: number[];
  reps: number[];
  weights: number[];
  bestWeightKg: number;
  bestWeightLbs: number;
}

const buildVariant = (id: string, sessions: Workout[]): RoutineVariant => {
  const sorted = [...sessions].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  const aggregate = new Map<string, ExerciseAggregate>();

  sorted.forEach(workout => {
    const seen = new Set<string>();
    workout.exercises.forEach((exercise, order) => {
      const title = exercise.exerciseTitle.trim();
      const key = title.toLowerCase();
      let entry = aggregate.get(key);
      if (!entry) {
        entry = {
          title,
          muscleGroup: exercise.muscleGroup,
          appearances: 0,
          orderSum: 0,
          orderCount: 0,
          sets: [],
          reps: [],
          weights: [],
          bestWeightKg: 0,
          bestWeightLbs: 0,
        };
        aggregate.set(key, entry);
      }

      if (!seen.has(key)) {
        entry.appearances += 1;
        entry.orderSum += order;
        entry.orderCount += 1;
        seen.add(key);
      }

      const workingSets = exercise.sets.filter(isWorkingSet);
      entry.sets.push(workingSets.length || exercise.sets.length);
      workingSets.forEach(set => {
        entry.reps.push(set.reps);
        if (set.weightKg > 0) entry.weights.push(set.weightKg);
      });
      entry.bestWeightKg = Math.max(entry.bestWeightKg, exercise.bestSetWeightKg);
      entry.bestWeightLbs = Math.max(entry.bestWeightLbs, exercise.bestSetWeightLbs);
    });
  });

  const exercises: RoutineExercise[] = [...aggregate.values()]
    .sort((a, b) => {
      const avgOrderA = a.orderCount ? a.orderSum / a.orderCount : 99;
      const avgOrderB = b.orderCount ? b.orderSum / b.orderCount : 99;
      return avgOrderA - avgOrderB || b.appearances - a.appearances;
    })
    .map(entry => {
      const weightKg = median(entry.weights);
      return {
        title: entry.title,
        muscleGroup: entry.muscleGroup,
        appearances: entry.appearances,
        sets: Math.round(median(entry.sets)),
        reps: Math.round(median(entry.reps)),
        weightKg,
        weightLbs: weightKg * 2.20462262,
        bestWeightKg: entry.bestWeightKg,
        bestWeightLbs: entry.bestWeightLbs,
      };
    });

  return {
    id,
    sessions: sorted.length,
    firstPerformed: sorted[0].startTime,
    lastPerformed: sorted[sorted.length - 1].startTime,
    avgDurationMinutes: mean(sorted.map(workout => workout.durationMinutes)),
    avgVolumeKg: mean(sorted.map(workout => workout.totalVolumeKg)),
    avgVolumeLbs: mean(sorted.map(workout => workout.totalVolumeLbs)),
    exercises,
    primaryMuscles: topMuscles(exercises),
  };
};

export function buildRoutines(workouts: Workout[]): Routine[] {
  const titleGroups = new Map<string, Workout[]>();

  workouts.forEach(workout => {
    if (workout.exercises.length === 0) return;
    if (workout.exercises.every(exercise => exercise.muscleGroup === 'Cardio')) return;
    const name = normalizeTitle(workout.title);
    if (!name) return;
    const key = name.toLowerCase();
    const bucket = titleGroups.get(key);
    if (bucket) bucket.push(workout);
    else titleGroups.set(key, [workout]);
  });

  const routines: Routine[] = [];

  titleGroups.forEach((sessions, key) => {
    if (sessions.length < 2) return;

    const variantGroups = new Map<string, Workout[]>();
    sessions.forEach(workout => {
      const variantKey = compositionKey(workout);
      if (!variantKey) return;
      const bucket = variantGroups.get(variantKey);
      if (bucket) bucket.push(workout);
      else variantGroups.set(variantKey, [workout]);
    });

    const variants = [...variantGroups.entries()]
      .map(([variantKey, variantSessions]) => buildVariant(`v-${hash(variantKey)}`, variantSessions))
      .sort((a, b) => b.lastPerformed.getTime() - a.lastPerformed.getTime());

    if (variants.length === 0) return;

    const sorted = [...sessions].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    routines.push({
      id: `r-${hash(key)}`,
      name: commonTitle(sessions),
      sessions: sorted.length,
      firstPerformed: sorted[0].startTime,
      lastPerformed: sorted[sorted.length - 1].startTime,
        avgDurationMinutes: mean(sorted.map(workout => workout.durationMinutes)),
      avgVolumeKg: mean(sorted.map(workout => workout.totalVolumeKg)),
      avgVolumeLbs: mean(sorted.map(workout => workout.totalVolumeLbs)),
      variants,
      primaryMuscles: topMuscles(variants.flatMap(variant => variant.exercises)),
    });
  });

  return routines.sort(
    (a, b) => b.lastPerformed.getTime() - a.lastPerformed.getTime() || b.sessions - a.sessions
  );
}
