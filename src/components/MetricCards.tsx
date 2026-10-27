import React, { useState, useMemo } from 'react';
import { Workout, UnitPreference } from '../types/workout';
import { Activity, Dumbbell, Clock, Flame, Trophy, Filter, ChevronDown, Check, Calendar } from 'lucide-react';

interface MetricCardsProps {
  totalWorkouts: number;
  totalVolumeKg: number;
  totalVolumeLbs: number;
  totalSets: number;
  totalReps: number;
  totalHours: number;
  totalPRs: number;
  unit: UnitPreference;
  dateRangeStr: string;
  workouts?: Workout[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  totalWorkouts,
  totalVolumeKg,
  totalVolumeLbs,
  totalSets,
  totalReps,
  totalHours,
  totalPRs,
  unit,
  dateRangeStr,
  workouts,
}) => {
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Extract available years if workouts provided
  const availableYears = useMemo(() => {
    if (!workouts || workouts.length === 0) return [];
    const set = new Set<number>();
    workouts.forEach(w => set.add(w.startTime.getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [workouts]);

  // Compute filtered metrics if a timeFilter is active
  const filteredMetrics = useMemo(() => {
    if (!workouts || workouts.length === 0 || timeFilter === 'all') {
      return {
        workoutsCount: totalWorkouts,
        volumeKg: totalVolumeKg,
        volumeLbs: totalVolumeLbs,
        sets: totalSets,
        reps: totalReps,
        hours: totalHours,
        prs: totalPRs,
        label: 'All Time',
      };
    }

    const now = new Date();
    let filtered = workouts;

    if (timeFilter === '30d') {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = workouts.filter(w => w.startTime >= cutoff);
    } else if (timeFilter === '90d') {
      const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      filtered = workouts.filter(w => w.startTime >= cutoff);
    } else if (timeFilter === '1y') {
      const cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      filtered = workouts.filter(w => w.startTime >= cutoff);
    } else {
      const yr = parseInt(timeFilter, 10);
      if (!isNaN(yr)) {
        filtered = workouts.filter(w => w.startTime.getFullYear() === yr);
      }
    }

    const volKg = filtered.reduce((acc, w) => acc + w.totalVolumeKg, 0);
    const volLbs = filtered.reduce((acc, w) => acc + w.totalVolumeLbs, 0);
    const sets = filtered.reduce((acc, w) => acc + w.totalSets, 0);
    const reps = filtered.reduce((acc, w) => acc + w.totalReps, 0);
    const durationMins = filtered.reduce((acc, w) => acc + w.durationMinutes, 0);
    const hours = Math.round((durationMins / 60) * 10) / 10;
    const prs = filtered.reduce(
      (acc, w) => acc + w.exercises.reduce((exAcc, ex) => exAcc + ex.sets.filter(s => s.isPR).length, 0),
      0
    );

    let label = 'Filtered';
    if (timeFilter === '30d') label = '30 Days';
    else if (timeFilter === '90d') label = '90 Days';
    else if (timeFilter === '1y') label = '1 Year';
    else if (!isNaN(parseInt(timeFilter, 10))) label = `${timeFilter}`;

    return {
      workoutsCount: filtered.length,
      volumeKg: volKg,
      volumeLbs: volLbs,
      sets,
      reps,
      hours,
      prs,
      label,
    };
  }, [workouts, timeFilter, totalWorkouts, totalVolumeKg, totalVolumeLbs, totalSets, totalReps, totalHours, totalPRs]);

  const volumeValue = unit === 'kg' ? filteredMetrics.volumeKg : filteredMetrics.volumeLbs;
  const formattedVolume = Math.round(volumeValue).toLocaleString();

  // Volume equivalency (approx 6,000 kg per elephant)
  const elephants = (filteredMetrics.volumeKg / 6000).toFixed(1);

  const filterOptions = useMemo(() => {
    const list = [
      { id: 'all', label: 'All Time (Full History)' },
      { id: '30d', label: 'Past 30 Days' },
      { id: '90d', label: 'Past 90 Days' },
      { id: '1y', label: 'Past 1 Year' },
    ];
    availableYears.forEach(yr => {
      list.push({ id: yr.toString(), label: `Year ${yr}` });
    });
    return list;
  }, [availableYears]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {/* 1. Lifetime Volume / Filter Button (Selector 1) */}
      <div className="col-span-2 sm:col-span-1 lg:col-span-1 bg-[#131D31] rounded-2xl p-3.5 sm:p-5 border border-[#1E293B] shadow-sm hover:border-[#3B82F6]/40 transition-all relative">
        <div className="relative mb-2">
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full flex items-center justify-between gap-1.5 py-1 px-1.5 -mx-1.5 rounded-lg bg-[#0B0F17]/70 hover:bg-[#1E293B] border border-[#1E293B] hover:border-[#38BDF8]/60 transition-all duration-150 active:scale-95 group text-left cursor-pointer shadow-sm"
            title="Filter metrics by timeframe"
            aria-label="Filter volume metrics"
            aria-expanded={isFilterOpen}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-md bg-[#1E3A8A]/50 text-[#38BDF8] flex items-center justify-center shrink-0 group-hover:bg-[#2563EB] group-hover:text-white transition-colors shadow-sm">
                <Filter className="w-3 h-3" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-[#94A3B8] leading-none uppercase tracking-wider">
                  Filter
                </span>
                <span className="text-xs font-bold text-[#F8FAFC] truncate leading-tight mt-0.5">
                  {filteredMetrics.label}
                </span>
              </div>
              <ChevronDown className={`w-3 h-3 text-[#94A3B8] group-hover:text-[#38BDF8] transition-transform duration-200 shrink-0 ml-0.5 ${isFilterOpen ? 'rotate-180' : ''}`} />
            </div>

            <div className="w-6 h-6 rounded-md bg-[#111A2E] text-[#60A5FA] flex items-center justify-center shrink-0">
              <Dumbbell className="w-3 h-3" />
            </div>
          </button>

          {/* Filter Popover Dropdown */}
          {isFilterOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsFilterOpen(false)}
              />
              <div className="absolute top-full left-0 mt-1.5 z-50 w-52 bg-[#0F172A] border border-[#1E293B] rounded-xl shadow-2xl p-1.5 text-xs animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#1E293B]/60 mb-1">
                  <Calendar className="w-3 h-3 text-[#38BDF8]" />
                  <span>Timeframe Filter</span>
                </div>

                <div className="space-y-0.5 max-h-48 overflow-y-auto">
                  {filterOptions.map((opt) => {
                    const isSelected = timeFilter === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setTimeFilter(opt.id);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-[#2563EB] text-white shadow-sm'
                            : 'text-[#CBD5E1] hover:bg-[#1E293B] hover:text-[#F8FAFC]'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>

                {timeFilter !== 'all' && (
                  <div className="pt-1 mt-1 border-t border-[#1E293B]/60">
                    <button
                      type="button"
                      onClick={() => {
                        setTimeFilter('all');
                        setIsFilterOpen(false);
                      }}
                      className="w-full text-center py-1 text-[11px] font-medium text-[#38BDF8] hover:underline"
                    >
                      Reset to All Time
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[#F8FAFC] tabular-nums font-mono">
          {formattedVolume}
          <span className="text-xs sm:text-sm font-semibold text-[#60A5FA] ml-1.5 font-sans">{unit}</span>
        </div>
        <div className="mt-2 text-xs text-[#94A3B8] flex items-center gap-1.5">
          <span>~{elephants} African elephants</span>
        </div>
      </div>

      {/* 2. Total Workouts */}
      <div className="bg-[#131D31] rounded-2xl p-3.5 sm:p-5 border border-[#1E293B] shadow-sm hover:border-[#3B82F6]/40 transition-all">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-[#94A3B8]">Workouts Logged</span>
          <div className="w-7 h-7 rounded-lg bg-[#0C4A6E]/40 text-[#38BDF8] flex items-center justify-center">
            <Activity className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[#F8FAFC] tabular-nums font-mono">
          {filteredMetrics.workoutsCount}
          <span className="text-xs sm:text-sm font-semibold text-[#38BDF8] ml-1.5 font-sans">sessions</span>
        </div>
        <div className="mt-2 text-xs text-[#94A3B8]">
          <span>{timeFilter === 'all' ? (dateRangeStr || 'Training history') : `Filtered by ${filteredMetrics.label}`}</span>
        </div>
      </div>

      {/* 3. Total Sets & Reps */}
      <div className="bg-[#131D31] rounded-2xl p-3.5 sm:p-5 border border-[#1E293B] shadow-sm hover:border-[#3B82F6]/40 transition-all">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-[#94A3B8]">Sets & Reps</span>
          <div className="w-7 h-7 rounded-lg bg-[#064E3B]/40 text-[#34D399] flex items-center justify-center">
            <Flame className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[#F8FAFC] tabular-nums font-mono">
          {filteredMetrics.sets.toLocaleString()}
          <span className="text-xs sm:text-sm font-semibold text-[#34D399] ml-1 font-sans">sets</span>
        </div>
        <div className="mt-2 text-xs text-[#94A3B8] flex items-center gap-1.5">
          <span>{filteredMetrics.reps.toLocaleString()} reps</span>
          <span aria-hidden="true">·</span>
          <span>~{filteredMetrics.sets > 0 ? Math.round(filteredMetrics.reps / filteredMetrics.sets) : 0} rps</span>
        </div>
      </div>

      {/* 4. Total Hours */}
      <div className="bg-[#131D31] rounded-2xl p-3.5 sm:p-5 border border-[#1E293B] shadow-sm hover:border-[#3B82F6]/40 transition-all">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-[#94A3B8]">Gym Time</span>
          <div className="w-7 h-7 rounded-lg bg-[#312E81]/40 text-[#818CF8] flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[#F8FAFC] tabular-nums font-mono">
          {filteredMetrics.hours}
          <span className="text-xs sm:text-sm font-semibold text-[#818CF8] ml-1.5 font-sans">hrs</span>
        </div>
        <div className="mt-2 text-xs text-[#94A3B8]">
          <span>~{filteredMetrics.workoutsCount > 0 ? Math.round((filteredMetrics.hours * 60) / filteredMetrics.workoutsCount) : 0} min avg workout</span>
        </div>
      </div>

      {/* 5. Personal Records (PRs) */}
      <div className="bg-[#131D31] rounded-2xl p-3.5 sm:p-5 border border-[#1E293B] shadow-sm hover:border-[#3B82F6]/40 transition-all">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-[#94A3B8]">Milestone PRs</span>
          <div className="w-7 h-7 rounded-lg bg-[#1E3A8A]/50 text-[#60A5FA] flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[#38BDF8] tabular-nums font-mono">
          {filteredMetrics.prs}
          <span className="text-xs sm:text-sm font-semibold text-[#94A3B8] ml-1.5 font-sans">records</span>
        </div>
        <div className="mt-2 text-xs text-[#94A3B8]">
          <span>Broken across sessions</span>
        </div>
      </div>
    </div>
  );
};
