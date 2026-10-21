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
      <div className="bg-[#131D31] rounded-2xl p-4 border border-[#1E293B] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search workouts, routines, or exercises (e.g. Bench, Squat)..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6] transition-colors"
          />
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Routine filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#64748B] hidden sm:inline" />
            <select
              value={routineFilter}
              onChange={e => setRoutineFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-[#CBD5E1] focus:outline-none focus:border-[#3B82F6] transition-colors"
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
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#64748B] hidden sm:inline" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-[#CBD5E1] focus:outline-none focus:border-[#3B82F6] transition-colors"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="volume-desc">Highest Volume</option>
            </select>
          </div>

          {/* Expand/Collapse Toggle */}
          <div className="flex items-center gap-1 border-l border-[#1E293B] pl-2 text-xs">
            <button
              onClick={expandAll}
              className="px-2 py-1.5 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] rounded-lg transition-colors"
              title="Expand all workouts"
            >
              Expand
            </button>
            <button
              onClick={collapseAll}
              className="px-2 py-1.5 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] rounded-lg transition-colors"
              title="Collapse all workouts"
            >
              Collapse
            </button>
          </div>
        </div>
      </div>

      {/* Result Count */}
      <div className="flex items-center justify-between text-xs text-[#94A3B8] px-1">
        <div>
          Showing <span className="font-semibold text-[#F8FAFC]">{filteredWorkouts.length}</span> of {workouts.length} workouts
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-[#38BDF8] hover:underline font-medium"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Workout Cards */}
      {filteredWorkouts.length === 0 ? (
        <div className="bg-[#131D31] rounded-2xl p-12 text-center border border-[#1E293B]">
          <Dumbbell className="w-10 h-10 text-[#334155] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#F8FAFC]">No workouts found</h3>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-sm mx-auto">
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
                className="bg-[#131D31] rounded-2xl border border-[#1E293B] shadow-sm hover:border-[#3B82F6]/40 transition-all overflow-hidden"
              >
                {/* Workout Card Header */}
                <div
                  onClick={() => toggleExpand(workout.id)}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-[#1E293B]/40 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#1E3A8A]/40 text-[#60A5FA] flex items-center justify-center shrink-0 mt-0.5">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-[#F8FAFC]">
                          {workout.title}
                        </h3>
                        {prCount > 0 && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#38BDF8] bg-[#0C4A6E]/40 px-2 py-0.5 rounded-lg border border-[#0284C7]/40">
                            <Trophy className="w-3.5 h-3.5 fill-[#38BDF8]" />
                            {prCount} PR{prCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Clean Unboxed Metadata */}
                      <div className="flex items-center gap-2 text-xs text-[#94A3B8] mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#64748B]" />
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
                        <span aria-hidden="true" className="text-[#475569]">·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#64748B]" />
                          {workout.durationMinutes} min
                        </span>
                        <span aria-hidden="true" className="text-[#475569]">·</span>
                        <span>{workout.exercises.length} exercises</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side stats & toggle */}
                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-[#1E293B]">
                    <div className="text-left md:text-right">
                      <div className="text-sm sm:text-base font-extrabold text-[#F8FAFC] tabular-nums font-mono">
                        {volume.toLocaleString()} {unit}
                      </div>
                      <div className="text-[11px] text-[#94A3B8]">
                        {workout.totalSets} sets · {workout.totalReps} reps
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWorkout(workout);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-[#E2E8F0] bg-[#1E293B] hover:bg-[#2563EB] hover:text-white rounded-xl transition-colors whitespace-nowrap"
                      >
                        Inspect
                      </button>
                      <button
                        className="w-8 h-8 rounded-xl bg-[#0B0F17] text-[#94A3B8] flex items-center justify-center hover:bg-[#1E293B] hover:text-[#F8FAFC] transition-colors"
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Workout description notes */}
                {workout.description && (
                  <div className="px-4 sm:px-5 pb-3 -mt-1 text-xs text-[#94A3B8] flex items-start gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#64748B] shrink-0 mt-0.5" />
                    <span className="italic">"{workout.description}"</span>
                  </div>
                )}

                {/* Expanded Exercise Breakdown */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-[#1E293B] bg-[#0B0F17]/40 space-y-3">
                    {workout.exercises.map((ex, exIdx) => {
                      const muscleStyle = MUSCLE_COLORS[ex.muscleGroup] || MUSCLE_COLORS['Full Body'];
                      const bestWeight = unit === 'kg' ? ex.bestSetWeightKg : ex.bestSetWeightLbs;
                      const best1RM = unit === 'kg' ? ex.bestSet1RMKg : ex.bestSet1RMLbs;

                      return (
                        <div
                          key={exIdx}
                          className="bg-[#131D31] rounded-xl p-3.5 border border-[#1E293B] shadow-sm hover:border-[#334155] transition-colors"
                        >
                          {/* Exercise Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => onSelectExercise(ex.exerciseTitle)}
                                className="font-bold text-sm text-[#F8FAFC] hover:text-[#38BDF8] hover:underline transition-colors text-left"
                              >
                                {ex.exerciseTitle}
                              </button>
                              <span className={`text-[11px] font-semibold ${muscleStyle.text}`}>
                                {ex.muscleGroup}
                              </span>
                              {ex.supersetId && (
                                <span className="text-[10px] font-bold text-[#A5B4FC] bg-[#312E81]/30 px-1.5 py-0.5 rounded-md border border-[#4F46E5]/40">
                                  Superset #{ex.supersetId}
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-[#94A3B8] flex items-center gap-2">
                              {bestWeight > 0 && (
                                <span>
                                  Top set: <strong className="tabular-nums font-mono text-[#F8FAFC]">{bestWeight} {unit}</strong>
                                </span>
                              )}
                              {best1RM > 0 && (
                                <>
                                  <span aria-hidden="true" className="text-[#475569]">·</span>
                                  <span>
                                    Est. 1RM: <strong className="tabular-nums font-mono text-[#38BDF8]">{best1RM} {unit}</strong>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {ex.notes && (
                            <div className="text-[11px] text-[#64748B] italic mb-2">
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
                                  className={`rounded-lg p-2 text-xs border transition-all ${
                                    set.isPR
                                      ? 'bg-[#1E3A8A]/40 border-[#3B82F6]/70 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                                      : isWarmup
                                      ? 'bg-[#0E1626] border-[#1E293B] opacity-75'
                                      : isFailure
                                      ? 'bg-[#4C1D95]/20 border-[#7E22CE]/40'
                                      : isDropset
                                      ? 'bg-[#312E81]/20 border-[#4F46E5]/40'
                                      : 'bg-[#0B0F17] border-[#1E293B]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px] text-[#64748B] font-medium mb-1">
                                    <span>
                                      Set {set.index}
                                      {isWarmup && ' (W)'}
                                      {isFailure && ' (F)'}
                                      {isDropset && ' (D)'}
                                    </span>
                                    {set.isPR && (
                                      <span className="flex items-center text-[#38BDF8] font-bold">
                                        <Trophy className="w-3 h-3 fill-[#38BDF8]" />
                                        PR
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-extrabold text-[#F8FAFC] tabular-nums font-mono text-xs">
                                    {weight > 0 ? `${weight} ${unit}` : 'Bodyweight'}
                                    <span className="text-[#94A3B8] font-sans font-normal ml-1">× {set.reps}</span>
                                  </div>
                                  {set.rpe && (
                                    <div className="text-[10px] text-[#64748B] mt-0.5">
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
