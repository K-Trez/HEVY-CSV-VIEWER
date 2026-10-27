import React, { useMemo, useState } from 'react';
import { ChevronDown, Repeat } from 'lucide-react';
import { UnitPreference, Workout } from '../types/workout';
import { MUSCLE_COLORS } from '../utils/muscleTaxonomy';
import { buildRoutines, Routine, RoutineExercise } from '../utils/routineAnalytics';

interface RoutinesViewProps {
  workouts: Workout[];
  unit: UnitPreference;
}

const formatWeight = (exercise: RoutineExercise, unit: UnitPreference): string => {
  const value = unit === 'kg' ? exercise.weightKg : exercise.weightLbs;
  if (value <= 0) return 'Bodyweight';
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 2) / 2;
  return `${rounded.toLocaleString()} ${unit}`;
};

const relativeDay = (date: Date): string => {
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 15) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const shortDate = (date: Date): string =>
  date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="text-[11px] text-ash">{label}</div>
    <div className="mt-0.5 text-[13px] font-medium text-chalk-2 tabular-nums">{value}</div>
  </div>
);

export const RoutinesView: React.FC<RoutinesViewProps> = ({ workouts, unit }) => {
  const routines = useMemo(() => buildRoutines(workouts), [workouts]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-chalk">Routines</h2>
          <p className="mt-1 text-[13px] text-dust">
            Templates detected from your logged lifting sessions. One-off workouts are left out.
          </p>
        </div>
        <span className="text-xs text-dust bg-sunken border border-line rounded-md px-2.5 py-1 tabular-nums">
          {routines.length} {routines.length === 1 ? 'routine' : 'routines'}
        </span>
      </div>

      {routines.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface px-6 py-12 text-center">
          <Repeat className="w-8 h-8 text-ash mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-chalk">No recurring templates yet</h3>
          <p className="mt-1 text-xs text-dust max-w-sm mx-auto">
            A routine appears here once you log the same group of exercises at least twice.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {routines.map(routine => {
            const expanded = expandedId === routine.id;
            const preview = routine.exercises.slice(0, 4);

            return (
              <article key={routine.id} className="rounded-xl border border-line bg-surface overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : routine.id)}
                  aria-expanded={expanded}
                  aria-controls={`routine-panel-${routine.id}`}
                  className="w-full text-left px-4 sm:px-5 py-4 hover:bg-raised/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold text-chalk truncate">{routine.name}</h3>
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[11px]">
                        {routine.primaryMuscles.map(muscle => (
                          <span key={muscle} className="inline-flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${MUSCLE_COLORS[muscle].bar}`} />
                            <span className="font-medium text-dust">{muscle}</span>
                          </span>
                        ))}
                        <span className="text-ash">·</span>
                        <span className="text-dust">{routine.exercises.length} {routine.exercises.length === 1 ? 'exercise' : 'exercises'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-dust tabular-nums">{routine.sessions} {routine.sessions === 1 ? 'session' : 'sessions'}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-ash transition-transform duration-150 ${
                          expanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <Stat label="Last done" value={relativeDay(routine.lastPerformed)} />
                    <Stat label="Cadence" value={`every ~${routine.cadenceDays} ${routine.cadenceDays === 1 ? 'day' : 'days'}`} />
                    <Stat label="Avg session" value={`${Math.round(routine.avgDurationMinutes)} min`} />
                  </div>

                  <div className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1.5">
                    {preview.map(exercise => (
                      <span key={exercise.title} className="flex items-center gap-1.5 text-[11.5px] text-dust">
                        <span className={`w-1 h-1 rounded-full ${MUSCLE_COLORS[exercise.muscleGroup].bar}`} />
                        <span className="max-w-[150px] truncate">{exercise.title}</span>
                        <span className="text-ash tabular-nums">
                          {exercise.sets}×{exercise.reps}
                        </span>
                      </span>
                    ))}
                    {routine.exercises.length > preview.length && (
                      <span className="text-[11.5px] text-ash">
                        +{routine.exercises.length - preview.length} more
                      </span>
                    )}
                  </div>
                </button>

                {expanded && (
                  <div id={`routine-panel-${routine.id}`} className="border-t border-line bg-sunken/30 px-4 sm:px-5 py-3.5">
                    <div className="text-xs font-medium text-dust mb-1.5">Typical lineup</div>
                    <ul className="divide-y divide-line">
                      {routine.exercises.map((exercise, index) => (
                        <li key={exercise.title} className="flex items-center justify-between gap-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-4 text-[11px] text-ash tabular-nums">{index + 1}</span>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${MUSCLE_COLORS[exercise.muscleGroup].bar}`} />
                            <span className="text-[13px] text-chalk-2 truncate">{exercise.title}</span>
                          </div>
                          <div className="text-[12px] text-dust tabular-nums shrink-0">
                            {exercise.sets} × {exercise.reps}
                            <span className="text-ash"> · </span>
                            {formatWeight(exercise, unit)}
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ash tabular-nums">
                      <span>
                        {Math.round(unit === 'kg' ? routine.avgVolumeKg : routine.avgVolumeLbs).toLocaleString()}{' '}
                        {unit} avg volume per session
                      </span>
                      <span>First logged {shortDate(routine.firstPerformed)}</span>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
