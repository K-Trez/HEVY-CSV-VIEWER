import React, { useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ChevronDown, Repeat } from 'lucide-react';
import { UnitPreference, Workout } from '../types/workout';
import { MUSCLE_COLORS } from '../utils/muscleTaxonomy';
import { buildRoutines, Routine, RoutineExercise, RoutineVariant } from '../utils/routineAnalytics';

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

const SORT_OPTIONS = [
  { id: 'last', label: 'Last done' },
  { id: 'created', label: 'First logged' },
  { id: 'duration', label: 'Session length' },
  { id: 'sessions', label: 'Times done' },
  { id: 'name', label: 'Name A–Z' },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]['id'];
type SortDirection = 'asc' | 'desc';

const DEFAULT_DIRECTION: Record<SortKey, SortDirection> = {
  last: 'desc',
  created: 'asc',
  duration: 'desc',
  sessions: 'desc',
  name: 'asc',
};

const sortRoutines = (routines: Routine[], key: SortKey, direction: SortDirection): Routine[] => {
  const factor = direction === 'asc' ? 1 : -1;
  const sorted = [...routines];

  const compare = (a: Routine, b: Routine): number => {
    switch (key) {
      case 'created':
        return a.firstPerformed.getTime() - b.firstPerformed.getTime();
      case 'duration':
        return a.avgDurationMinutes - b.avgDurationMinutes;
      case 'sessions':
        return a.sessions - b.sessions;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'last':
      default:
        return a.lastPerformed.getTime() - b.lastPerformed.getTime();
    }
  };

  return sorted.sort((a, b) => factor * compare(a, b) || b.sessions - a.sessions);
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="text-[11px] text-ash">{label}</div>
    <div className="mt-0.5 text-[13px] font-medium text-chalk-2 tabular-nums">{value}</div>
  </div>
);

const VariantBlock: React.FC<{ variant: RoutineVariant; unit: UnitPreference }> = ({ variant, unit }) => (
  <div className="rounded-lg border border-line bg-void/40 p-3">
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <span className="text-xs font-semibold text-chalk">{shortDate(variant.lastPerformed)}</span>
      <span className="text-[11px] text-ash tabular-nums">
        {variant.sessions} {variant.sessions === 1 ? 'session' : 'sessions'} ·{' '}
        {Math.round(variant.avgDurationMinutes)} min
      </span>
    </div>
    <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
      {variant.exercises.map(exercise => (
        <li key={exercise.title} className="flex items-center justify-between gap-3 text-[11.5px]">
          <span className="flex items-center gap-1.5 min-w-0">
            <span className={`w-1 h-1 rounded-full shrink-0 ${MUSCLE_COLORS[exercise.muscleGroup].bar}`} />
            <span className="truncate text-dust">{exercise.title}</span>
          </span>
          <span className="text-ash tabular-nums shrink-0">
            {exercise.sets}×{exercise.reps}
            {exercise.weightKg > 0 && ` · ${formatWeight(exercise, unit)}`}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

export const RoutinesView: React.FC<RoutinesViewProps> = ({ workouts, unit }) => {
  const routines = useMemo(() => buildRoutines(workouts), [workouts]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('last');
  const [direction, setDirection] = useState<SortDirection>('desc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const sortTriggerRef = useRef<HTMLButtonElement>(null);
  const sortListRef = useRef<HTMLDivElement>(null);

  const sortedRoutines = useMemo(
    () => sortRoutines(routines, sortKey, direction),
    [routines, sortKey, direction]
  );
  const activeSort = SORT_OPTIONS.find(option => option.id === sortKey) ?? SORT_OPTIONS[0];
  const directionLabels =
    sortKey === 'name'
      ? { asc: 'A–Z', desc: 'Z–A' }
      : sortKey === 'last' || sortKey === 'created'
        ? { asc: 'Oldest first', desc: 'Newest first' }
        : { asc: 'Smallest first', desc: 'Biggest first' };

  React.useEffect(() => {
    if (!isSortOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSortOpen(false);
        sortTriggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isSortOpen]);

  React.useEffect(() => {
    if (!isSortOpen) return;
    const list = sortListRef.current;
    const active =
      list?.querySelector<HTMLButtonElement>('[aria-selected="true"]') ??
      list?.querySelector<HTMLButtonElement>('[role="option"]');
    active?.focus();
  }, [isSortOpen]);

  const handleSortKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const options = Array.from(
      sortListRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []
    );
    if (options.length === 0) return;
    const current = options.indexOf(document.activeElement as HTMLButtonElement);
    let next: number | null = null;
    if (event.key === 'ArrowDown') next = current < 0 ? 0 : (current + 1) % options.length;
    else if (event.key === 'ArrowUp') next = current <= 0 ? options.length - 1 : current - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = options.length - 1;
    else if (event.key === 'Tab') {
      setIsSortOpen(false);
      return;
    }
    if (next !== null) {
      event.preventDefault();
      options[next].focus();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-chalk">Routines</h2>
          <p className="mt-1 text-[13px] text-dust">
            Grouped by workout name. Expand to see each variation, newest first.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div ref={sortMenuRef} className="relative">
            <div
              className={`flex items-stretch rounded-lg border bg-sunken overflow-hidden [&:has(:focus-visible)]:outline [&:has(:focus-visible)]:outline-2 [&:has(:focus-visible)]:outline-offset-2 [&:has(:focus-visible)]:outline-plate ${
                isSortOpen ? 'border-line-strong' : 'border-line'
              }`}
            >
            <button
              type="button"
              onClick={() => setDirection(direction === 'asc' ? 'desc' : 'asc')}
              title={`Sorted ${directionLabels[direction].toLowerCase()} — click to reverse`}
              aria-label={`Sort direction: ${directionLabels[direction]}. Activate to switch to ${directionLabels[
                direction === 'asc' ? 'desc' : 'asc'
              ].toLowerCase()}.`}
              className="flex items-center justify-center w-8 text-dust hover:text-chalk hover:bg-raised border-r border-line transition-colors focus-visible:outline-none"
            >
              {direction === 'asc' ? (
                <ArrowUp className="w-3.5 h-3.5" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              ref={sortTriggerRef}
              type="button"
              onClick={() => setIsSortOpen(open => !open)}
              onKeyDown={event => {
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                  event.preventDefault();
                  setIsSortOpen(true);
                }
              }}
              aria-haspopup="listbox"
              aria-expanded={isSortOpen}
              aria-controls="routine-sort-listbox"
              aria-label="Sort routines"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-dust hover:text-chalk transition-colors focus-visible:outline-none"
            >
              <span className="text-ash hidden sm:inline">Sort:</span>
              <span>{activeSort.label}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-ash transition-transform duration-150 ${
                  isSortOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            </div>

            {isSortOpen && (
              <div
                id="routine-sort-listbox"
                ref={sortListRef}
                role="listbox"
                tabIndex={-1}
                aria-label="Sort routines by"
                onKeyDown={handleSortKeyDown}
                className="animate-menu-in absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border border-line bg-surface shadow-lg p-1"
              >
                {SORT_OPTIONS.map(option => {
                  const selected = option.id === sortKey;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="option"
                      tabIndex={-1}
                      aria-selected={selected}
                      onClick={() => {
                        setSortKey(option.id);
                        setDirection(DEFAULT_DIRECTION[option.id]);
                        setIsSortOpen(false);
                        sortTriggerRef.current?.focus();
                      }}
                      className={`w-full flex items-center justify-between gap-2 text-left px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        selected
                          ? 'bg-raised text-chalk'
                          : 'text-dust hover:bg-raised hover:text-chalk'
                      }`}
                    >
                      <span>{option.label}</span>
                      {selected && <Check className="w-3.5 h-3.5 text-plate" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <span className="text-xs text-dust bg-sunken border border-line rounded-lg px-2.5 py-1.5 tabular-nums">
            {routines.length} {routines.length === 1 ? 'routine' : 'routines'}
          </span>
        </div>
      </div>

      {routines.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface px-6 py-12 text-center">
          <Repeat className="w-8 h-8 text-ash mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-chalk">No routines yet</h3>
          <p className="mt-1 text-xs text-dust max-w-sm mx-auto">
            A routine appears here once you log the same workout name at least twice.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {sortedRoutines.map(routine => {
            const expanded = expandedId === routine.id;
            const latest = routine.variants[0];
            const preview = latest.exercises.slice(0, 4);

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
                        <span className="text-dust">
                          {routine.variants.length}{' '}
                          {routine.variants.length === 1 ? 'variation' : 'variations'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-dust tabular-nums">
                        {routine.sessions} {routine.sessions === 1 ? 'session' : 'sessions'}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-ash transition-transform duration-150 ${
                          expanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Stat label="Last done" value={relativeDay(routine.lastPerformed)} />
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
                    {latest.exercises.length > preview.length && (
                      <span className="text-[11.5px] text-ash">
                        +{latest.exercises.length - preview.length} more in latest
                      </span>
                    )}
                  </div>
                </button>

                {expanded && (
                  <div
                    id={`routine-panel-${routine.id}`}
                    className="border-t border-line bg-sunken/30 px-4 sm:px-5 py-3.5"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-xs font-medium text-dust">Variations · newest first</span>
                      <span className="text-[11px] text-ash tabular-nums">
                        first logged {shortDate(routine.firstPerformed)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {routine.variants.map(variant => (
                        <VariantBlock key={variant.id} variant={variant} unit={unit} />
                      ))}
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ash tabular-nums">
                      <span>
                        {Math.round(
                          unit === 'kg' ? routine.avgVolumeKg : routine.avgVolumeLbs
                        ).toLocaleString()}{' '}
                        {unit} avg volume per session
                      </span>
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
