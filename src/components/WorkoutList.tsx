import React, { useState, useMemo } from 'react';
import { Workout, UnitPreference } from '../types/workout';
import { MUSCLE_COLORS } from '../utils/muscleTaxonomy';
import { Search, Filter, ArrowUpDown, ChevronDown, ChevronUp, Trophy, Clock, Dumbbell, Calendar, FileText } from 'lucide-react';

interface WorkoutListProps {
  workouts: Workout[];
  unit: UnitPreference;
  onSelectWorkout: (workout: Workout) => void;
  onSelectExercise: (exerciseTitle: string) => void;
}

export const WorkoutList: React.FC<WorkoutListProps> = ({
  workouts,
  unit,
  onSelectWorkout,
  onSelectExercise,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [routineFilter, setRoutineFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'volume-desc'>('date-desc');
  const [expandedWorkouts, setExpandedWorkouts] = useState<Record<string, boolean>>({});

  const uniqueRoutines = useMemo(() => {
    const set = new Set<string>();
    workouts.forEach(w => set.add(w.title));
    return Array.from(set).sort();
  }, [workouts]);

  const filteredWorkouts = useMemo(() => {
    return workouts
      .filter(w => {
        const matchesSearch =
          searchTerm === '' ||
          w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.exercises.some(e => e.exerciseTitle.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesRoutine = routineFilter === 'all' || w.title === routineFilter;

        return matchesSearch && matchesRoutine;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return b.startTime.getTime() - a.startTime.getTime();
        if (sortBy === 'date-asc') return a.startTime.getTime() - b.startTime.getTime();
        if (sortBy === 'volume-desc') {
          const volA = unit === 'kg' ? a.totalVolumeKg : a.totalVolumeLbs;
          const volB = unit === 'kg' ? b.totalVolumeKg : b.totalVolumeLbs;
          return volB - volA;
        }
        return 0;
      });
  }, [workouts, searchTerm, routineFilter, sortBy, unit]);

  const toggleExpand = (id: string) => {
    setExpandedWorkouts(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    filteredWorkouts.forEach(w => {
      next[w.id] = true;
    });
    setExpandedWorkouts(next);
  };

  const collapseAll = () => {
    setExpandedWorkouts({});
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-surface rounded-xl p-4 border border-line shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ash absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search workouts, routines, or exercises (e.g. Bench, Squat)..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-void border border-line rounded-lg text-chalk placeholder-ash focus:outline-none focus:border-plate transition-colors"
          />
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-between sm:justify-start">
          {/* Routine filter */}
          <div className="flex items-center gap-1.5 text-xs flex-1 sm:flex-initial min-w-[120px]">
            <Filter className="w-3.5 h-3.5 text-ash hidden sm:inline" />
            <select
              value={routineFilter}
              onChange={e => setRoutineFilter(e.target.value)}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs bg-void border border-line rounded-lg text-chalk-2 focus:outline-none focus:border-plate transition-colors"
            >
              <option value="all">All Routines ({workouts.length})</option>
              {uniqueRoutines.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 text-xs flex-1 sm:flex-initial min-w-[110px]">
            <ArrowUpDown className="w-3.5 h-3.5 text-ash hidden sm:inline" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs bg-void border border-line rounded-lg text-chalk-2 focus:outline-none focus:border-plate transition-colors"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="volume-desc">Highest Volume</option>
            </select>
          </div>

          {/* Expand/Collapse Toggle: square-y buttons */}
          <div className="flex items-center gap-1 border-l border-line pl-2 text-xs shrink-0">
            <button
              onClick={expandAll}
              className="px-2.5 py-1 text-xs font-semibold text-dust hover:text-chalk hover:bg-raised rounded-[4px] transition-colors duration-150"
              title="Expand all workouts"
            >
              Expand
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1 text-xs font-semibold text-dust hover:text-chalk hover:bg-raised rounded-[4px] transition-colors duration-150"
              title="Collapse all workouts"
            >
              Collapse
            </button>
          </div>
        </div>
      </div>

      {/* Result Count */}
      <div className="flex items-center justify-between text-xs text-dust px-1">
        <div>
          Showing <span className="font-semibold text-chalk">{filteredWorkouts.length}</span> of {workouts.length} workouts
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-plate hover:underline font-medium"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Workout Cards */}
      {filteredWorkouts.length === 0 ? (
        <div className="bg-surface rounded-xl p-12 text-center border border-line">
          <Dumbbell className="w-10 h-10 text-ash mx-auto mb-3" />
          <h3 className="text-base font-semibold text-chalk">No workouts found</h3>
          <p className="text-xs text-dust mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords or switching routine filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredWorkouts.map(workout => {
            const isExpanded = expandedWorkouts[workout.id] ?? true;
            const volume = unit === 'kg' ? workout.totalVolumeKg : workout.totalVolumeLbs;
            const prCount = workout.exercises.reduce(
              (acc, ex) => acc + ex.sets.filter(s => s.isPR).length,
              0
            );

            return (
              <div
                key={workout.id}
                className="bg-surface rounded-xl border border-line shadow-sm hover:border-plate/40 transition-colors overflow-hidden"
              >
                {/* Workout Card Header */}
                <div
                  onClick={() => toggleExpand(workout.id)}
                  className="p-3.5 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-raised/40 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-raised text-ash flex items-center justify-center shrink-0 mt-0.5">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-chalk">
                          {workout.title}
                        </h3>
                        {prCount > 0 && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-plate bg-tint-plate/60 px-2 py-0.5 rounded-[4px] border border-plate/30">
                            <Trophy className="w-3.5 h-3.5 fill-plate" />
                            {prCount} PR{prCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Clean Unboxed Metadata */}
                      <div className="flex items-center gap-2 text-xs text-dust mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-ash" />
                          {workout.startTime.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {' at '}
                          {workout.startTime.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                        <span aria-hidden="true" className="text-ash">·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-ash" />
                          {workout.durationMinutes} min
                        </span>
                        <span aria-hidden="true" className="text-ash">·</span>
                        <span>{workout.exercises.length} exercises</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side stats & toggle */}
                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-line">
                    <div className="text-left md:text-right">
                      <div className="text-sm sm:text-base font-semibold text-chalk tabular-nums font-mono">
                        {volume.toLocaleString()} {unit}
                      </div>
                      <div className="text-[11px] text-dust">
                        {workout.totalSets} sets · {workout.totalReps} reps
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWorkout(workout);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-chalk-2 bg-raised hover:bg-plate hover:text-on-plate rounded-lg transition-colors duration-150 whitespace-nowrap shadow-sm"
                      >
                        Inspect
                      </button>
                      <button
                        className="w-8 h-8 rounded-lg bg-void text-dust flex items-center justify-center hover:bg-raised hover:text-chalk transition-colors duration-150 border border-line"
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Workout description notes */}
                {workout.description && (
                  <div className="px-4 sm:px-5 pb-3 -mt-1 text-xs text-dust flex items-start gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-ash shrink-0 mt-0.5" />
                    <span className="italic">"{workout.description}"</span>
                  </div>
                )}

                {/* Expanded Exercise Breakdown */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-line bg-void/40 space-y-3">
                    {workout.exercises.map((ex, exIdx) => {
                      const muscleStyle = MUSCLE_COLORS[ex.muscleGroup] || MUSCLE_COLORS['Full Body'];
                      const bestWeight = unit === 'kg' ? ex.bestSetWeightKg : ex.bestSetWeightLbs;
                      const best1RM = unit === 'kg' ? ex.bestSet1RMKg : ex.bestSet1RMLbs;

                      return (
                        <div
                          key={exIdx}
                          className="bg-surface rounded-lg p-3.5 border border-line shadow-sm hover:border-line-strong transition-colors"
                        >
                          {/* Exercise Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => onSelectExercise(ex.exerciseTitle)}
                                className="font-semibold text-sm text-chalk hover:text-plate hover:underline transition-colors text-left"
                              >
                                {ex.exerciseTitle}
                              </button>
                              <span className={`text-[11px] font-semibold ${muscleStyle.text}`}>
                                {ex.muscleGroup}
                              </span>
                              {ex.supersetId && (
                                <span className="text-[10px] font-semibold text-steel bg-tint-steel/30 px-1.5 py-0.5 rounded-lg border border-steel/40">
                                  Superset #{ex.supersetId}
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-dust flex items-center gap-2">
                              {bestWeight > 0 && (
                                <span>
                                  Top set: <strong className="tabular-nums font-mono text-chalk">{bestWeight} {unit}</strong>
                                </span>
                              )}
                              {best1RM > 0 && (
                                <>
                                  <span aria-hidden="true" className="text-ash">·</span>
                                  <span>
                                    Est. 1RM: <strong className="tabular-nums font-mono text-plate">{best1RM} {unit}</strong>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {ex.notes && (
                            <div className="text-[11px] text-ash italic mb-2">
                              Note: {ex.notes}
                            </div>
                          )}

                          {/* Sets Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {ex.sets.map((set, sIdx) => {
                              const weight = unit === 'kg' ? set.weightKg : set.weightLbs;
                              const isWarmup = set.type === 'warmup';
                              const isFailure = set.type === 'failure';
                              const isDropset = set.type === 'dropset';

                              return (
                                <div
                                  key={sIdx}
                                  className={`rounded-lg p-2 text-xs border transition-colors ${
                                    set.isPR
                                      ? 'bg-tint-plate/60 border-plate/50'
                                      : isWarmup
                                      ? 'bg-void border-line opacity-75'
                                      : isFailure
                                      ? 'bg-tint-ply/40 border-danger/25'
                                      : isDropset
                                      ? 'bg-tint-ply/40 border-danger/25'
                                      : 'bg-void border-line'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px] text-ash font-medium mb-1">
                                    <span>
                                      Set {set.index}
                                      {isWarmup && ' (W)'}
                                      {isFailure && ' (F)'}
                                      {isDropset && ' (D)'}
                                    </span>
                                    {set.isPR && (
                                      <span className="flex items-center text-plate font-semibold">
                                        <Trophy className="w-3 h-3 fill-plate" />
                                        PR
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-semibold text-chalk tabular-nums font-mono text-xs">
                                    {weight > 0 ? `${weight} ${unit}` : 'Bodyweight'}
                                    <span className="text-dust font-sans font-normal ml-1">× {set.reps}</span>
                                  </div>
                                  {set.rpe && (
                                    <div className="text-[10px] text-ash mt-0.5">
                                      RPE {set.rpe}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
