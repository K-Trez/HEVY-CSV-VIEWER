import { MuscleGroup, SetType, Workout, WorkoutExercise, WorkoutSet, ExerciseStats, ExerciseDataPoint } from '../types/workout';
import { categorizeExercise } from './muscleTaxonomy';

const LBS_PER_KG = 2.20462262;

// Parse standard CSV text with quote and comma handling
export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let currentVal = '';
  let insideQuote = false;

  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentVal += '"';
        i++; // skip escaped quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      row.push(currentVal.trim());
      currentVal = '';
    } else if (char === '\n' && !insideQuote) {
      row.push(currentVal.trim());
      if (row.some(cell => cell.length > 0)) {
        lines.push(row);
      }
      row = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal.length > 0 || row.length > 0) {
    row.push(currentVal.trim());
    if (row.some(cell => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

// Parses flexible dates from Hevy ("15 Jul 2026, 09:52", "2026-07-15 09:52:00", etc.)
export function parseHevyDate(dateStr: string): Date {
  if (!dateStr) return new Date();

  // Try standard parse first
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  // Handle format: "15 Jul 2026, 09:52" or "15 Jul 2026 09:52"
  const regex = /(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})(?:,\s*|\s+)(\d{1,2}):(\d{2})(?::(\d{2}))?/;
  const match = dateStr.match(regex);
  if (match) {
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
      january: 0, february: 1, march: 2, april: 3, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
    };
    const day = parseInt(match[1], 10);
    const monthStr = match[2].toLowerCase();
    const month = months[monthStr] ?? 0;
    const year = parseInt(match[3], 10);
    const hours = parseInt(match[4], 10);
    const minutes = parseInt(match[5], 10);
    const seconds = match[6] ? parseInt(match[6], 10) : 0;
    return new Date(year, month, day, hours, minutes, seconds);
  }

  return new Date();
}

export function calculate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  // Epley formula: W * (1 + r / 30)
  return weight * (1 + reps / 30);
}

export interface ParsedHevyData {
  workouts: Workout[];
  exerciseStats: Record<string, ExerciseStats>;
  sourceUnit: 'kg' | 'lbs';
  totalLifetimeVolumeKg: number;
  totalLifetimeVolumeLbs: number;
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalHours: number;
  dateRange: { start?: Date; end?: Date };
}

export function parseHevyCSV(csvContent: string): ParsedHevyData {
  const rows = parseCSV(csvContent);
  if (rows.length < 2) {
    return {
      workouts: [],
      exerciseStats: {},
      sourceUnit: 'kg',
      totalLifetimeVolumeKg: 0,
      totalLifetimeVolumeLbs: 0,
      totalWorkouts: 0,
      totalSets: 0,
      totalReps: 0,
      totalHours: 0,
      dateRange: {}
    };
  }

  const headerRow = rows[0].map(h => h.toLowerCase().trim());
  const colIndex = {
    title: headerRow.indexOf('title'),
    startTime: headerRow.indexOf('start_time'),
    endTime: headerRow.indexOf('end_time'),
    description: headerRow.indexOf('description'),
    exerciseTitle: headerRow.indexOf('exercise_title'),
    supersetId: headerRow.indexOf('superset_id'),
    exerciseNotes: headerRow.indexOf('exercise_notes'),
    setIndex: headerRow.indexOf('set_index'),
    setType: headerRow.indexOf('set_type'),
    weightKg: headerRow.indexOf('weight_kg'),
    weightLbs: headerRow.indexOf('weight_lbs'),
    reps: headerRow.indexOf('reps'),
    distanceKm: headerRow.indexOf('distance_km'),
    distanceMiles: headerRow.indexOf('distance_miles'),
    durationSeconds: headerRow.indexOf('duration_seconds'),
    rpe: headerRow.indexOf('rpe'),
  };

  const isLbsSource = colIndex.weightLbs !== -1 && (colIndex.weightKg === -1 || colIndex.weightLbs < colIndex.weightKg);
  const sourceUnit: 'kg' | 'lbs' = isLbsSource ? 'lbs' : 'kg';

  // Group by workout (keyed by title + startTime)
  const workoutMap = new Map<string, {
    title: string;
    startTime: Date;
    endTime?: Date;
    description?: string;
    exercisesMap: Map<string, {
      exerciseTitle: string;
      notes?: string;
      supersetId?: number;
      sets: WorkoutSet[];
    }>;
  }>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || !row[colIndex.exerciseTitle]?.trim()) continue;

    const title = colIndex.title !== -1 ? row[colIndex.title] || 'Workout' : 'Workout';
    const startTimeRaw = colIndex.startTime !== -1 ? row[colIndex.startTime] : '';
    const endTimeRaw = colIndex.endTime !== -1 ? row[colIndex.endTime] : '';
    const description = colIndex.description !== -1 ? row[colIndex.description] : '';
    const exerciseTitle = (colIndex.exerciseTitle !== -1 ? row[colIndex.exerciseTitle] : '').trim();
    const exerciseNotes = colIndex.exerciseNotes !== -1 ? row[colIndex.exerciseNotes] : '';
    const supersetRaw = colIndex.supersetId !== -1 ? row[colIndex.supersetId] : '';
    const supersetId = supersetRaw ? parseInt(supersetRaw, 10) || undefined : undefined;
    const setIndex = colIndex.setIndex !== -1 ? parseInt(row[colIndex.setIndex], 10) || 1 : 1;
    const setTypeRaw = (colIndex.setType !== -1 ? row[colIndex.setType] : 'normal').toLowerCase();

    let setType: SetType = 'normal';
    if (setTypeRaw.includes('warm') || setTypeRaw === 'w') setType = 'warmup';
    else if (setTypeRaw.includes('drop') || setTypeRaw === 'd') setType = 'dropset';
    else if (setTypeRaw.includes('fail') || setTypeRaw === 'f') setType = 'failure';

    // Parse weight
    let weightKg = 0;
    let weightLbs = 0;

    if (isLbsSource && colIndex.weightLbs !== -1) {
      const parsedVal = parseFloat(row[colIndex.weightLbs]) || 0;
      weightLbs = parsedVal;
      weightKg = parsedVal / LBS_PER_KG;
    } else if (colIndex.weightKg !== -1) {
      const parsedVal = parseFloat(row[colIndex.weightKg]) || 0;
      weightKg = parsedVal;
      weightLbs = parsedVal * LBS_PER_KG;
    } else if (colIndex.weightLbs !== -1) {
      const parsedVal = parseFloat(row[colIndex.weightLbs]) || 0;
      weightLbs = parsedVal;
      weightKg = parsedVal / LBS_PER_KG;
    }

    const reps = colIndex.reps !== -1 ? parseInt(row[colIndex.reps], 10) || 0 : 0;
    const rpe = colIndex.rpe !== -1 && row[colIndex.rpe] ? parseFloat(row[colIndex.rpe]) || undefined : undefined;
    const durationSeconds = colIndex.durationSeconds !== -1 && row[colIndex.durationSeconds] ? parseFloat(row[colIndex.durationSeconds]) || undefined : undefined;

    const estimated1RMKg = calculate1RM(weightKg, reps);
    const estimated1RMLbs = calculate1RM(weightLbs, reps);
    const volumeKg = weightKg * reps;
    const volumeLbs = weightLbs * reps;

    const workoutKey = `${title}_${startTimeRaw}`;
    if (!workoutMap.has(workoutKey)) {
      workoutMap.set(workoutKey, {
        title,
        startTime: parseHevyDate(startTimeRaw),
        endTime: endTimeRaw ? parseHevyDate(endTimeRaw) : undefined,
        description: description || undefined,
        exercisesMap: new Map(),
      });
    }

    const wItem = workoutMap.get(workoutKey)!;
    // Group exercise by exerciseTitle + notes to preserve order
    const exKey = `${exerciseTitle}_${supersetId ?? 'none'}`;
    if (!wItem.exercisesMap.has(exKey)) {
      wItem.exercisesMap.set(exKey, {
        exerciseTitle,
        notes: exerciseNotes || undefined,
        supersetId,
        sets: [],
      });
    }

    wItem.exercisesMap.get(exKey)!.sets.push({
      index: setIndex,
      type: setType,
      weightKg: Math.round(weightKg * 100) / 100,
      weightLbs: Math.round(weightLbs * 10) / 10,
      reps,
      durationSeconds,
      rpe,
      estimated1RMKg: Math.round(estimated1RMKg * 100) / 100,
      estimated1RMLbs: Math.round(estimated1RMLbs * 10) / 10,
      volumeKg: Math.round(volumeKg * 100) / 100,
      volumeLbs: Math.round(volumeLbs * 10) / 10,
    });
  }

  // Convert map to Workout objects sorted chronologically
  const rawWorkoutsList = Array.from(workoutMap.values()).map(w => {
    let workoutTotalVolumeKg = 0;
    let workoutTotalVolumeLbs = 0;
    let workoutTotalSets = 0;
    let workoutTotalReps = 0;
    const primaryMusclesSet = new Set<MuscleGroup>();

    const exercises: WorkoutExercise[] = Array.from(w.exercisesMap.values()).map(ex => {
      const { primary, secondary } = categorizeExercise(ex.exerciseTitle);
      primaryMusclesSet.add(primary);
      if (secondary) primaryMusclesSet.add(secondary);

      let exVolumeKg = 0;
      let exVolumeLbs = 0;
      let best1RMKg = 0;
      let best1RMLbs = 0;
      let bestWeightKg = 0;
      let bestWeightLbs = 0;
      let maxReps = 0;

      for (const s of ex.sets) {
        if (s.type !== 'warmup') {
          exVolumeKg += s.volumeKg;
          exVolumeLbs += s.volumeLbs;
        }
        if (s.estimated1RMKg > best1RMKg) best1RMKg = s.estimated1RMKg;
        if (s.estimated1RMLbs > best1RMLbs) best1RMLbs = s.estimated1RMLbs;
        if (s.weightKg > bestWeightKg) bestWeightKg = s.weightKg;
        if (s.weightLbs > bestWeightLbs) bestWeightLbs = s.weightLbs;
        if (s.reps > maxReps) maxReps = s.reps;
      }

      workoutTotalVolumeKg += exVolumeKg;
      workoutTotalVolumeLbs += exVolumeLbs;
      workoutTotalSets += ex.sets.length;
      workoutTotalReps += ex.sets.reduce((sum, s) => sum + s.reps, 0);

      return {
        exerciseTitle: ex.exerciseTitle,
        notes: ex.notes,
        supersetId: ex.supersetId,
        sets: ex.sets,
        muscleGroup: primary,
        secondaryMuscle: secondary,
        totalVolumeKg: Math.round(exVolumeKg * 100) / 100,
        totalVolumeLbs: Math.round(exVolumeLbs * 10) / 10,
        bestSet1RMKg: Math.round(best1RMKg * 100) / 100,
        bestSet1RMLbs: Math.round(best1RMLbs * 10) / 10,
        bestSetWeightKg: Math.round(bestWeightKg * 100) / 100,
        bestSetWeightLbs: Math.round(bestWeightLbs * 10) / 10,
        maxReps,
      };
    });

    let durationMinutes = 60;
    if (w.endTime && w.startTime) {
      const diffMin = Math.round((w.endTime.getTime() - w.startTime.getTime()) / (1000 * 60));
      if (diffMin > 5 && diffMin < 360) durationMinutes = diffMin;
    }

    return {
      id: `w-${w.startTime.getTime()}-${Math.random().toString(36).substring(2, 7)}`,
      title: w.title,
      startTime: w.startTime,
      endTime: w.endTime,
      durationMinutes,
      description: w.description,
      exercises,
      totalVolumeKg: Math.round(workoutTotalVolumeKg * 100) / 100,
      totalVolumeLbs: Math.round(workoutTotalVolumeLbs * 10) / 10,
      totalSets: workoutTotalSets,
      totalReps: workoutTotalReps,
      primaryMuscles: Array.from(primaryMusclesSet),
    };
  });

  // Sort ascending by time to calculate PRs sequentially
  rawWorkoutsList.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  // Track sequential PRs and compile ExerciseStats
  const exerciseStatsMap: Record<string, ExerciseStats> = {};
  const exercisePeak1RM: Record<string, number> = {};

  for (const workout of rawWorkoutsList) {
    for (const ex of workout.exercises) {
      const exName = ex.exerciseTitle;
      if (!exerciseStatsMap[exName]) {
        exerciseStatsMap[exName] = {
          exerciseTitle: exName,
          muscleGroup: ex.muscleGroup,
          secondaryMuscle: ex.secondaryMuscle,
          totalSets: 0,
          totalReps: 0,
          totalLifetimeVolumeKg: 0,
          totalLifetimeVolumeLbs: 0,
          allTimeMaxWeightKg: 0,
          allTimeMaxWeightLbs: 0,
          allTimeEstimated1RMKg: 0,
          allTimeEstimated1RMLbs: 0,
          repMaxRecords: {},
          firstPerformed: workout.startTime,
          lastPerformed: workout.startTime,
          history: [],
        };
        exercisePeak1RM[exName] = 0;
      }

      const stats = exerciseStatsMap[exName];
      stats.lastPerformed = workout.startTime;
      stats.totalSets += ex.sets.length;
      stats.totalLifetimeVolumeKg += ex.totalVolumeKg;
      stats.totalLifetimeVolumeLbs += ex.totalVolumeLbs;

      let workoutBestWeightKg = 0;
      let workoutBestWeightLbs = 0;
      let workoutBestReps = 0;
      let workoutBest1RMKg = 0;
      let workoutBest1RMLbs = 0;

      for (const set of ex.sets) {
        stats.totalReps += set.reps;

        // Check if this set is an all-time PR up to this workout
        if (set.type !== 'warmup' && set.estimated1RMKg > (exercisePeak1RM[exName] || 0) && set.estimated1RMKg > 0) {
          set.isPR = true;
          exercisePeak1RM[exName] = set.estimated1RMKg;
        }

        if (set.weightKg > stats.allTimeMaxWeightKg) {
          stats.allTimeMaxWeightKg = set.weightKg;
          stats.allTimeMaxWeightLbs = set.weightLbs;
        }
        if (set.estimated1RMKg > stats.allTimeEstimated1RMKg) {
          stats.allTimeEstimated1RMKg = set.estimated1RMKg;
          stats.allTimeEstimated1RMLbs = set.estimated1RMLbs;
        }

        // Track rep maxes (e.g. 1RM, 3RM, 5RM, 8RM, 10RM)
        if (set.type !== 'warmup' && set.weightKg > 0) {
          const recs = stats.repMaxRecords;
          if (set.reps >= 1 && (!recs.oneRM || set.weightKg > recs.oneRM.weightKg)) {
            recs.oneRM = { weightKg: set.weightKg, weightLbs: set.weightLbs, reps: set.reps, date: workout.startTime };
          }
          if (set.reps >= 3 && (!recs.threeRM || set.weightKg > recs.threeRM.weightKg)) {
            recs.threeRM = { weightKg: set.weightKg, weightLbs: set.weightLbs, reps: set.reps, date: workout.startTime };
          }
          if (set.reps >= 5 && (!recs.fiveRM || set.weightKg > recs.fiveRM.weightKg)) {
            recs.fiveRM = { weightKg: set.weightKg, weightLbs: set.weightLbs, reps: set.reps, date: workout.startTime };
          }
          if (set.reps >= 8 && (!recs.eightRM || set.weightKg > recs.eightRM.weightKg)) {
            recs.eightRM = { weightKg: set.weightKg, weightLbs: set.weightLbs, reps: set.reps, date: workout.startTime };
          }
          if (set.reps >= 10 && (!recs.tenRM || set.weightKg > recs.tenRM.weightKg)) {
            recs.tenRM = { weightKg: set.weightKg, weightLbs: set.weightLbs, reps: set.reps, date: workout.startTime };
          }
        }

        if (set.weightKg > workoutBestWeightKg) {
          workoutBestWeightKg = set.weightKg;
          workoutBestWeightLbs = set.weightLbs;
          workoutBestReps = set.reps;
        }
        if (set.estimated1RMKg > workoutBest1RMKg) {
          workoutBest1RMKg = set.estimated1RMKg;
          workoutBest1RMLbs = set.estimated1RMLbs;
        }
      }

      const historyPoint: ExerciseDataPoint = {
        date: workout.startTime,
        workoutTitle: workout.title,
        workoutId: workout.id,
        bestWeightKg: workoutBestWeightKg,
        bestWeightLbs: workoutBestWeightLbs,
        bestReps: workoutBestReps,
        estimated1RMKg: workoutBest1RMKg,
        estimated1RMLbs: workoutBest1RMLbs,
        totalVolumeKg: ex.totalVolumeKg,
        totalVolumeLbs: ex.totalVolumeLbs,
        totalSets: ex.sets.length,
      };

      stats.history.push(historyPoint);
    }
  }

  // Workouts for display: default to descending order (newest first)
  const workouts = [...rawWorkoutsList].reverse();

  let totalLifetimeVolumeKg = 0;
  let totalLifetimeVolumeLbs = 0;
  let totalSets = 0;
  let totalReps = 0;
  let totalDurationMinutes = 0;

  for (const w of workouts) {
    totalLifetimeVolumeKg += w.totalVolumeKg;
    totalLifetimeVolumeLbs += w.totalVolumeLbs;
    totalSets += w.totalSets;
    totalReps += w.totalReps;
    totalDurationMinutes += w.durationMinutes;
  }

  const dateRange = {
    start: rawWorkoutsList.length > 0 ? rawWorkoutsList[0].startTime : undefined,
    end: rawWorkoutsList.length > 0 ? rawWorkoutsList[rawWorkoutsList.length - 1].startTime : undefined,
  };

  return {
    workouts,
    exerciseStats: exerciseStatsMap,
    sourceUnit,
    totalLifetimeVolumeKg: Math.round(totalLifetimeVolumeKg),
    totalLifetimeVolumeLbs: Math.round(totalLifetimeVolumeLbs),
    totalWorkouts: workouts.length,
    totalSets,
    totalReps,
    totalHours: Math.round((totalDurationMinutes / 60) * 10) / 10,
    dateRange,
  };
}
