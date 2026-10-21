import React from 'react';
import { UnitPreference } from '../types/workout';
import { Activity, Dumbbell, Clock, Flame, Trophy } from 'lucide-react';

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
}) => {
  const volumeValue = unit === 'kg' ? totalVolumeKg : totalVolumeLbs;
  const formattedVolume = volumeValue.toLocaleString();

  // Volume equivalency (approx 6,000 kg per elephant)
  const elephants = (totalVolumeKg / 6000).toFixed(1);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {/* 1. Lifetime Volume */}
      <div className="col-span-2 sm:col-span-1 lg:col-span-1 bg-[#131D31] rounded-2xl p-4 sm:p-5 border border-[#1E293B] shadow-sm hover:border-[#3B82F6]/40 transition-all">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-[#94A3B8]">Total Volume</span>
          <div className="w-7 h-7 rounded-lg bg-[#1E3A8A]/40 text-[#60A5FA] flex items-center justify-center">
            <Dumbbell className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC] tabular-nums font-mono">
          {formattedVolume}
          <span className="text-sm font-semibold text-[#60A5FA] ml-1.5 font-sans">{unit}</span>
        </div>
        <div className="mt-2 text-xs text-[#94A3B8] flex items-center gap-1.5">
          <span>~{elephants} African elephants</span>
        </div>
      </div>

      {/* 2. Total Workouts */}
      <div className="bg-[#131D31] rounded-2xl p-4 sm:p-5 border border-[#1E293B] shadow-sm hover:border-[#3B82F6]/40 transition-all">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-[#94A3B8]">Workouts Logged</span>
          <div className="w-7 h-7 rounded-lg bg-[#0C4A6E]/40 text-[#38BDF8] flex items-center justify-center">
            <Activity className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC] tabular-nums font-mono">
          {totalWorkouts}
          <span className="text-sm font-semibold text-[#38BDF8] ml-1.5 font-sans">sessions</span>
        </div>
        <div className="mt-2 text-xs text-[#94A3B8]">
          <span>{dateRangeStr || 'Training history'}</span>
        </div>
      </div>

      {/* 3. Total Sets & Reps */}
      <div className="bg-[#131D31] rounded-2xl p-4 sm:p-5 border border-[#1E293B] shadow-sm hover:border-[#3B82F6]/40 transition-all">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-[#94A3B8]">Sets & Reps</span>
          <div className="w-7 h-7 rounded-lg bg-[#064E3B]/40 text-[#34D399] flex items-center justify-center">
            <Flame className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC] tabular-nums font-mono">
          {totalSets.toLocaleString()}
          <span className="text-sm font-semibold text-[#34D399] ml-1 font-sans">sets</span>
        </div>
        <div className="mt-2 text-xs text-[#94A3B8] flex items-center gap-1.5">
          <span>{totalReps.toLocaleString()} reps</span>
          <span aria-hidden="true">·</span>
          <span>~{totalSets > 0 ? Math.round(totalReps / totalSets) : 0} rps</span>
        </div>
      </div>

      {/* 4. Total Hours */}
      <div className="bg-[#131D31] rounded-2xl p-4 sm:p-5 border border-[#1E293B] shadow-sm hover:border-[#3B82F6]/40 transition-all">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-[#94A3B8]">Gym Time</span>
          <div className="w-7 h-7 rounded-lg bg-[#312E81]/40 text-[#818CF8] flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC] tabular-nums font-mono">
          {totalHours}
          <span className="text-sm font-semibold text-[#818CF8] ml-1.5 font-sans">hrs</span>
        </div>
        <div className="mt-2 text-xs text-[#94A3B8]">
          <span>~{totalWorkouts > 0 ? Math.round((totalHours * 60) / totalWorkouts) : 0} min avg workout</span>
        </div>
      </div>

      {/* 5. Personal Records (PRs) */}
      <div className="col-span-2 sm:col-span-1 lg:col-span-1 bg-[#131D31] rounded-2xl p-4 sm:p-5 border border-[#1E293B] shadow-sm hover:border-[#3B82F6]/40 transition-all">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-[#94A3B8]">Milestone PRs</span>
          <div className="w-7 h-7 rounded-lg bg-[#1E3A8A]/50 text-[#60A5FA] flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#38BDF8] tabular-nums font-mono">
          {totalPRs}
          <span className="text-sm font-semibold text-[#94A3B8] ml-1.5 font-sans">records</span>
        </div>
        <div className="mt-2 text-xs text-[#94A3B8]">
          <span>Broken across sessions</span>
        </div>
      </div>
    </div>
  );
};
