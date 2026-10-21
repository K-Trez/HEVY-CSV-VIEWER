import React, { useState, useMemo } from 'react';
import { Workout, UnitPreference } from '../types/workout';
import { Flame, Calendar, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeatmapCalendarProps {
  workouts: Workout[];
  unit: UnitPreference;
  onSelectWorkout: (workout: Workout) => void;
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({
  workouts,
  unit,
  onSelectWorkout,
}) => {
  // Extract all unique years available in workouts
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    workouts.forEach(w => yearsSet.add(w.startTime.getFullYear()));
    return Array.from(yearsSet).sort((a, b) => b - a); // descending
  }, [workouts]);

  const [selectedRange, setSelectedRange] = useState<string>('all'); // 'all' or year string e.g. '2026', '2025'

  const [hoveredDay, setHoveredDay] = useState<{
    dateStr: string;
    dayWorkouts: Workout[];
    x: number;
    y: number;
  } | null>(null);

  // Map workouts by date key "YYYY-MM-DD"
  const workoutDateMap = useMemo(() => {
    const map = new Map<string, Workout[]>();
    workouts.forEach(w => {
      const key = w.startTime.toISOString().split('T')[0];
      const existing = map.get(key) || [];
      existing.push(w);
      map.set(key, existing);
    });
    return map;
  }, [workouts]);

  // Determine start and end date based on selectedRange
  const { weeks, monthLabels, totalDaysCount, activeDaysCount, rangeVolumeKg, rangeWorkoutsCount } = useMemo(() => {
    if (workouts.length === 0) {
      return { weeks: [], monthLabels: [], totalDaysCount: 0, activeDaysCount: 0, rangeVolumeKg: 0, rangeWorkoutsCount: 0 };
    }

    let startDate: Date;
    let endDate: Date;

    const timestamps = workouts.map(w => w.startTime.getTime());
    const minTimestamp = Math.min(...timestamps);
    const maxTimestamp = Math.max(...timestamps);

    if (selectedRange === 'all') {
      // From very earliest workout to latest workout
      const earliest = new Date(minTimestamp);
      const latest = new Date(maxTimestamp);

      // Start on Sunday of the earliest week
      startDate = new Date(earliest);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      startDate.setHours(0, 0, 0, 0);

      // End on Saturday of the latest week
      endDate = new Date(latest);
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Specific calendar year
      const year = parseInt(selectedRange, 10);
      const jan1 = new Date(year, 0, 1);
      startDate = new Date(jan1);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      startDate.setHours(0, 0, 0, 0);

      const dec31 = new Date(year, 11, 31);
      endDate = new Date(dec31);
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
      endDate.setHours(23, 59, 59, 999);
    }

    // Calculate number of weeks
    const diffTime = endDate.getTime() - startDate.getTime();
    const totalWeeksCount = Math.max(1, Math.ceil(diffTime / (7 * 24 * 60 * 60 * 1000)));

    const generatedWeeks: Array<Array<{ date: Date; dateStr: string; workouts: Workout[] }>> = [];
    const curr = new Date(startDate);

    let activeDays = 0;
    let rangeVol = 0;
    let rangeWCount = 0;

    for (let w = 0; w < totalWeeksCount; w++) {
      const weekDays: Array<{ date: Date; dateStr: string; workouts: Workout[] }> = [];
      for (let d = 0; d < 7; d++) {
        const dCopy = new Date(curr);
        const dateStr = dCopy.toISOString().split('T')[0];
        const dayWorkouts = workoutDateMap.get(dateStr) || [];
        if (dayWorkouts.length > 0) {
          activeDays++;
          rangeWCount += dayWorkouts.length;
          dayWorkouts.forEach(item => {
            rangeVol += item.totalVolumeKg;
          });
        }
        weekDays.push({
          date: dCopy,
          dateStr,
          workouts: dayWorkouts,
        });
        curr.setDate(curr.getDate() + 1);
      }
      generatedWeeks.push(weekDays);
    }

    // Build header month/year labels
    const labels: Array<{ label: string; yearPrefix?: string; weekIndex: number }> = [];
    let lastMonth = -1;
    let lastYear = -1;

    generatedWeeks.forEach((week, idx) => {
      const firstDayOfWeek = week[0].date;
      const m = firstDayOfWeek.getMonth();
      const y = firstDayOfWeek.getFullYear();

      if (m !== lastMonth && firstDayOfWeek.getDate() <= 14) {
        const showYear = y !== lastYear && selectedRange === 'all';
        labels.push({
          label: firstDayOfWeek.toLocaleDateString('en-US', { month: 'short' }),
          yearPrefix: showYear ? `${y}` : undefined,
          weekIndex: idx,
        });
        lastMonth = m;
        lastYear = y;
      }
    });

    return {
      weeks: generatedWeeks,
      monthLabels: labels,
      totalDaysCount: totalWeeksCount * 7,
      activeDaysCount: activeDays,
      rangeVolumeKg: rangeVol,
      rangeWorkoutsCount: rangeWCount,
    };
  }, [workouts, workoutDateMap, selectedRange]);

  // Calculate streak across weeks
  const maxStreakWeeks = useMemo(() => {
    let max = 0;
    let streak = 0;
    weeks.forEach(week => {
      const count = week.reduce((sum, day) => sum + day.workouts.length, 0);
      if (count >= 2) {
        streak++;
        if (streak > max) max = streak;
      } else {
        streak = 0;
      }
    });
    return max;
  }, [weeks]);

  // Dark mode blue intensity levels
  const getHeatmapColor = (count: number, volumeKg: number) => {
    if (count === 0) return 'bg-[#1E293B]/60 border-[#334155]/40 hover:border-[#64748B]';
    if (count === 1 && volumeKg < 6000) return 'bg-[#1E3A8A] border-[#2563EB]/70 hover:bg-[#1D4ED8]';
    if (count === 1 && volumeKg < 12000) return 'bg-[#2563EB] border-[#3B82F6] hover:bg-[#3B82F6]';
    if (count >= 2 || volumeKg >= 12000) return 'bg-[#3B82F6] border-[#60A5FA] text-white hover:bg-[#60A5FA] shadow-[0_0_8px_rgba(59,130,246,0.5)]';
    return 'bg-[#38BDF8] border-[#7DD3FC] text-[#0B0F17] shadow-[0_0_10px_rgba(56,189,248,0.7)]';
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="bg-[#131D31] rounded-2xl p-5 border border-[#1E293B] shadow-sm relative">
      {/* Top Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#38BDF8]" />
            <h2 className="text-base font-bold text-[#F8FAFC]">
              Workout Activity & Consistency
            </h2>
          </div>
          <div className="text-xs text-[#94A3B8] mt-0.5">
            {selectedRange === 'all'
              ? `All-Time Training History (${weeks.length} weeks total · ${activeDaysCount} active days)`
              : `Year ${selectedRange} Training History (${weeks.length} weeks · ${rangeWorkoutsCount} workouts)`}
          </div>
        </div>

        {/* Controls: Range Filter Buttons & Streak Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Time range selector */}
          <div className="flex items-center gap-1 bg-[#0B0F17] p-1 rounded-xl border border-[#1E293B] text-xs font-semibold">
            <button
              onClick={() => setSelectedRange('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedRange === 'all'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              All Time
            </button>
            {availableYears.map(yr => (
              <button
                key={yr}
                onClick={() => setSelectedRange(yr.toString())}
                className={`px-3 py-1 rounded-lg transition-all ${
                  selectedRange === yr.toString()
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

          {/* Streak Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A8A]/30 text-[#60A5FA] rounded-xl border border-[#2563EB]/40 font-semibold text-xs">
            <Flame className="w-3.5 h-3.5 text-[#38BDF8] fill-[#38BDF8]" />
            <span>Best Streak: {maxStreakWeeks} wks</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid (Smooth horizontal scroll without layout jump) */}
      <div className="overflow-x-auto pb-3 pt-1">
        <div className="min-w-fit">
          {/* Month & Year labels */}
          <div className="flex text-[11px] font-semibold text-[#64748B] mb-2 pl-6 relative h-5 select-none">
            {monthLabels.map((item, idx) => (
              <div
                key={idx}
                className="absolute whitespace-nowrap flex items-center gap-1"
                style={{ left: `${item.weekIndex * 17 + 24}px` }}
              >
                {item.yearPrefix && (
                  <span className="text-[#38BDF8] font-bold mr-0.5">{item.yearPrefix}</span>
                )}
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-1.5">
            {/* Day of week labels */}
            <div className="flex flex-col gap-1 text-[10px] font-semibold text-[#64748B] pr-1.5 justify-between py-0.5 select-none shrink-0">
              {dayNames.map((name, i) => (
                <span key={i} className="h-3.5 leading-3.5 text-center">
                  {i % 2 === 1 ? name : ''}
                </span>
              ))}
            </div>

            {/* Heatmap Columns (Weeks) */}
            <div className="flex gap-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1 shrink-0">
                  {week.map((day, dIdx) => {
                    const dayVolumeKg = day.workouts.reduce((acc, w) => acc + w.totalVolumeKg, 0);
                    const hasWorkout = day.workouts.length > 0;

                    return (
                      <button
                        key={dIdx}
                        onClick={() => {
                          if (hasWorkout) {
                            onSelectWorkout(day.workouts[0]);
                          }
                        }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredDay({
                            dateStr: day.dateStr,
                            dayWorkouts: day.workouts,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 8,
                          });
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                        /* Jitter-free: zero transform/scale changes on hover */
                        className={`w-3.5 h-3.5 rounded-[3px] border cursor-pointer outline-none transition-colors ${
                          hasWorkout
                            ? 'hover:ring-2 hover:ring-[#38BDF8] hover:ring-offset-1 hover:ring-offset-[#131D31]'
                            : 'cursor-default'
                        } ${getHeatmapColor(day.workouts.length, dayVolumeKg)}`}
                        aria-label={`${day.dateStr}: ${day.workouts.length} workout(s)`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend and summary */}
          <div className="flex items-center justify-between text-xs text-[#94A3B8] mt-3.5 pt-2.5 border-t border-[#1E293B]">
            <div className="flex items-center gap-2 text-[11px]">
              <span>Rest day</span>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-[3px] bg-[#1E293B]/60 border border-[#334155]/40"></span>
                <span className="w-3 h-3 rounded-[3px] bg-[#1E3A8A] border border-[#2563EB]/70"></span>
                <span className="w-3 h-3 rounded-[3px] bg-[#2563EB] border border-[#3B82F6]"></span>
                <span className="w-3 h-3 rounded-[3px] bg-[#3B82F6] border border-[#60A5FA]"></span>
                <span className="w-3 h-3 rounded-[3px] bg-[#38BDF8] border border-[#7DD3FC]"></span>
              </div>
              <span>Heavy session / High volume</span>
            </div>

            <div className="text-[11px] text-[#64748B]">
              Showing all {rangeWorkoutsCount} sessions · Click any blue square to inspect
            </div>
          </div>
        </div>
      </div>

      {/* Floating Hover Tooltip (pointer-events-none ensures zero jitter/collision) */}
      {hoveredDay && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 bg-[#0F172A] text-white text-xs rounded-xl py-2 px-3 shadow-2xl border border-[#334155] min-w-[190px] animate-in fade-in"
          style={{ left: `${hoveredDay.x}px`, top: `${hoveredDay.y}px` }}
        >
          <div className="font-semibold text-[11px] text-[#94A3B8]">
            {new Date(hoveredDay.dateStr).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
          {hoveredDay.dayWorkouts.length === 0 ? (
            <div className="text-[#64748B] text-[11px] mt-0.5">Rest / Recovery day</div>
          ) : (
            <div className="mt-1 space-y-1.5">
              {hoveredDay.dayWorkouts.map((w, idx) => (
                <div key={idx} className="border-t border-[#1E293B] pt-1 first:border-0 first:pt-0">
                  <div className="font-bold text-[#F8FAFC] text-xs leading-snug">{w.title}</div>
                  <div className="text-[11px] text-[#38BDF8] flex items-center gap-1.5 mt-0.5 tabular-nums font-mono">
                    <span>
                      {(unit === 'kg' ? w.totalVolumeKg : w.totalVolumeLbs).toLocaleString()} {unit}
                    </span>
                    <span aria-hidden="true" className="text-[#64748B]">·</span>
                    <span className="font-sans text-[#CBD5E1]">{w.durationMinutes} min</span>
                    <span aria-hidden="true" className="text-[#64748B]">·</span>
                    <span className="font-sans text-[#CBD5E1]">{w.exercises.length} exs</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
