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

export interface Routine {
  id: string;
  name: string;
  sessions: number;
  lastPerformed: Date;
  firstPerformed: Date;
  cadenceDays: number;
  avgDurationMinutes: number;
  avgVolumeKg: number;
  avgVolumeLbs: number;
  exercises: RoutineExercise[];
  primaryMuscles: MuscleGroup[];
}

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const compositionKey = (workout: Workout): string =>
  [...new Set(workout.exercises.map(ex => ex.exerciseTitle.trim().toLowerCase()))]
    .sort()
    .join('|');

const isWorkingSet = (set: WorkoutSet): boolean => set.type !== 'warmup' && set.reps > 0;

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

export function buildRoutines(workouts: Workout[]): Routine[] {
  const groups = new Map<string, Workout[]>();

  workouts.forEach(workout => {
    if (workout.exercises.length === 0) return;
    if (workout.exercises.every(exercise => exercise.muscleGroup === 'Cardio')) return;
    const key = compositionKey(workout);
    if (!key) return;
    const bucket = groups.get(key);
    if (bucket) bucket.push(workout);
    else groups.set(key, [workout]);
  });

  const routines: Routine[] = [];
  const nameCounts = new Map<string, number>();

  groups.forEach((sessions, id) => {
    if (sessions.length < 2) return;

    const sorted = [...sessions].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    const titleCounts = new Map<string, number>();
    sorted.forEach(workout => {
      const title = workout.title.trim();
      titleCounts.set(title, (titleCounts.get(title) ?? 0) + 1);
    });
    const name = [...titleCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];

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

    const muscleCounts = new Map<MuscleGroup, number>();
    exercises.forEach(exercise => {
      muscleCounts.set(exercise.muscleGroup, (muscleCounts.get(exercise.muscleGroup) ?? 0) + exercise.appearances);
    });
    const primaryMuscles = [...muscleCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([muscle]) => muscle);

    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push((sorted[i].startTime.getTime() - sorted[i - 1].startTime.getTime()) / 86400000);
    }

    routines.push({
      id,
      name,
      sessions: sorted.length,
      lastPerformed: sorted[sorted.length - 1].startTime,
      firstPerformed: sorted[0].startTime,
      cadenceDays: Math.max(1, Math.round(median(gaps))),
      avgDurationMinutes: sorted.reduce((sum, w) => sum + w.durationMinutes, 0) / sorted.length,
      avgVolumeKg: sorted.reduce((sum, w) => sum + w.totalVolumeKg, 0) / sorted.length,
      avgVolumeLbs: sorted.reduce((sum, w) => sum + w.totalVolumeLbs, 0) / sorted.length,
      exercises,
      primaryMuscles,
    });
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
  });

  const genericTitle = /^(morning|afternoon|evening|night|midnight|lunch|workout|session|training|gym)\b/i;
  const baseNames = new Map(routines.map(routine => [routine.id, routine.name]));

  routines.forEach(routine => {
    const base = baseNames.get(routine.id) ?? routine.name;
    const repeated = (nameCounts.get(base) ?? 0) > 1;
    if (!repeated && !genericTitle.test(base)) return;
    const focus = routine.primaryMuscles[0];
    routine.name = focus ? `${base || 'Session'} · ${focus}` : base || 'Session';
  });

  // Still ambiguous (same title and same focus): distinguish by lineup size.
  const focusedCounts = new Map<string, number>();
  routines.forEach(routine => focusedCounts.set(routine.name, (focusedCounts.get(routine.name) ?? 0) + 1));
  routines.forEach(routine => {
    if ((focusedCounts.get(routine.name) ?? 0) < 2) return;
    const count = routine.exercises.length;
    routine.name = `${routine.name} · ${count} ${count === 1 ? 'exercise' : 'exercises'}`;
  });

  return routines.sort(
    (a, b) => b.sessions - a.sessions || b.lastPerformed.getTime() - a.lastPerformed.getTime()
  );
}
