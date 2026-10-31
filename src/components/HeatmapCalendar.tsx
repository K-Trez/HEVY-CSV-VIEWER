import React, { useState, useMemo } from 'react';
import { Workout, UnitPreference } from '../types/workout';
import { Flame, Calendar } from 'lucide-react';

interface HeatmapCalendarProps {
  workouts: Workout[];
  unit: UnitPreference;
  onSelectWorkout: (workout: Workout) => void;
  theme?: 'dark' | 'light';
}

interface YearCalendarData {
  year: number;
  weeks: Array<Array<{ date: Date; dateStr: string; isInYear: boolean; workouts: Workout[] }>>;
  monthLabels: Array<{ label: string; weekIndex: number }>;
  workoutCount: number;
  activeDaysCount: number;
  volumeKg: number;
  volumeLbs: number;
  maxStreakWeeks: number;
}

// Heatmap keys must follow the local calendar, not UTC, or a +TZ user's
// evening workout lands on the wrong weekday.
const toDateKey = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const fromDateKey = (key: string): Date => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({
  workouts,
  unit,
  onSelectWorkout,
  theme = 'dark',
}) => {
  // Extract all unique years available from workouts, sorted chronologically ascending (2025 at top, then 2026)
  const availableYears = useMemo(() => {
    if (workouts.length === 0) return [new Date().getFullYear()];
    const yearsSet = new Set<number>();
    workouts.forEach(w => yearsSet.add(w.startTime.getFullYear()));
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [workouts]);

  const [selectedTab, setSelectedTab] = useState<string>('all'); // 'all' or year number e.g. '2025', '2026'

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
      const key = toDateKey(w.startTime);
      const existing = map.get(key) || [];
      existing.push(w);
      map.set(key, existing);
    });
    return map;
  }, [workouts]);

  // Build a complete Jan 1 - Dec 31 calendar grid for a specific year
  const buildCalendarForYear = (year: number): YearCalendarData => {
    const jan1 = new Date(year, 0, 1);
    const startDate = new Date(jan1);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Sunday before Jan 1
    startDate.setHours(0, 0, 0, 0);

    const dec31 = new Date(year, 11, 31);
    const endDate = new Date(dec31);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // Saturday after Dec 31
    endDate.setHours(23, 59, 59, 999);

    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const totalWeeks = Math.ceil(diffDays / 7);

    const weeks: Array<Array<{ date: Date; dateStr: string; isInYear: boolean; workouts: Workout[] }>> = [];
    const curr = new Date(startDate);

    let workoutCount = 0;
    let activeDaysCount = 0;
    let volumeKg = 0;
    let volumeLbs = 0;

    for (let w = 0; w < totalWeeks; w++) {
      const weekDays: Array<{ date: Date; dateStr: string; isInYear: boolean; workouts: Workout[] }> = [];
      for (let d = 0; d < 7; d++) {
        const dCopy = new Date(curr);
        const dateStr = toDateKey(dCopy);
        const isInYear = dCopy.getFullYear() === year;
        const dayWorkouts = isInYear ? (workoutDateMap.get(dateStr) || []) : [];

        if (isInYear && dayWorkouts.length > 0) {
          activeDaysCount++;
          workoutCount += dayWorkouts.length;
          dayWorkouts.forEach(item => {
            volumeKg += item.totalVolumeKg;
            volumeLbs += item.totalVolumeLbs;
          });
        }

        weekDays.push({
          date: dCopy,
          dateStr,
          isInYear,
          workouts: dayWorkouts,
        });
        curr.setDate(curr.getDate() + 1);
      }
      weeks.push(weekDays);
    }

    // Compute month labels Jan - Dec
    const monthLabels: Array<{ label: string; weekIndex: number }> = [];
    let lastMonth = -1;
    weeks.forEach((week, idx) => {
      const dayInYear = week.find(d => d.isInYear);
      if (dayInYear) {
        const m = dayInYear.date.getMonth();
        if (m !== lastMonth && dayInYear.date.getDate() <= 14) {
          monthLabels.push({
            label: dayInYear.date.toLocaleDateString('en-US', { month: 'short' }),
            weekIndex: idx,
          });
          lastMonth = m;
        }
      }
    });

    // Compute streak of weeks with >= 2 sessions in this year
    let maxStreakWeeks = 0;
    let runningStreak = 0;
    weeks.forEach(week => {
      const count = week.reduce((sum, d) => sum + (d.isInYear ? d.workouts.length : 0), 0);
      if (count >= 2) {
        runningStreak++;
        if (runningStreak > maxStreakWeeks) maxStreakWeeks = runningStreak;
      } else {
        runningStreak = 0;
      }
    });

    return {
      year,
      weeks,
      monthLabels,
      workoutCount,
      activeDaysCount,
      volumeKg: Math.round(volumeKg),
      volumeLbs: Math.round(volumeLbs),
      maxStreakWeeks,
    };
  };

  // Compile calendar data for each year
  const allYearsData = useMemo(() => {
    return availableYears.map(yr => buildCalendarForYear(yr));
  }, [availableYears, workoutDateMap]);

  // Filter which years to display
  const displayedYears = useMemo(() => {
    if (selectedTab === 'all') {
      return allYearsData;
    }
    const targetYear = parseInt(selectedTab, 10);
    return allYearsData.filter(y => y.year === targetYear);
  }, [allYearsData, selectedTab]);

  // Overall streak across all workouts
  const totalStreakWeeks = useMemo(() => {
    return Math.max(...allYearsData.map(y => y.maxStreakWeeks), 0);
  }, [allYearsData]);

  // Master month labels from the first year to use as a shared top header
  const masterMonthLabels = useMemo(() => {
    return allYearsData[0]?.monthLabels || [];
  }, [allYearsData]);

  // Binary by design: trained days are blue, rest days are not.
  const getHeatmapColor = (dayWorkouts: Workout[]) => {
    if (dayWorkouts.length === 0) {
      return theme === 'light'
        ? 'bg-raised border-transparent hover:border-line-strong/70'
        : 'bg-raised/45 border-transparent hover:border-line-strong/50';
    }
    return 'heat-cube-3 hover:brightness-110';
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return (
    <div className="bg-surface rounded-xl p-3.5 sm:p-5 border border-line shadow-sm relative space-y-3.5">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-plate" />
            <h2 className="text-sm sm:text-base font-semibold text-chalk">
              Workout Activity & Consistency
            </h2>
          </div>
          <div className="text-xs text-dust mt-0.5">
            {selectedTab === 'all'
              ? 'All-time timeline · Jan–Dec calendar'
              : `Calendar year ${selectedTab} · Jan–Dec`}
          </div>
        </div>

        {/* Year selector, streak, and tab controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-void p-0.5 rounded-lg border border-line text-xs font-semibold overflow-x-auto max-w-full">
            <button
              onClick={() => setSelectedTab('all')}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors duration-150 shrink-0 ${
                selectedTab === 'all'
                  ? 'bg-raised text-chalk shadow-sm'
                  : 'text-dust hover:text-chalk'
              }`}
            >
              All Time
            </button>
            {availableYears.map(yr => (
              <button
                key={yr}
                onClick={() => setSelectedTab(yr.toString())}
                className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors duration-150 shrink-0 ${
                  selectedTab === yr.toString()
                    ? 'bg-raised text-chalk shadow-sm'
                    : 'text-dust hover:text-chalk'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-raised text-dust rounded-lg border border-line font-semibold text-xs shrink-0">
            <Flame className="w-3.5 h-3.5 text-gold" />
            <span>{totalStreakWeeks} wk streak</span>
          </div>
        </div>
      </div>

      {/* Unified Joined Calendar Container */}
      <div className="w-full overflow-hidden rounded-lg border border-line/70 bg-void/40 p-2 sm:p-2.5">
        <div className="w-full select-none">
          {/* Shared Standardized Month Labels across the top */}
          <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 text-[9px] sm:text-[10px] font-semibold text-ash select-none">
            <div className="w-9 sm:w-11 shrink-0" />
            <div className="w-2 shrink-0" />
            <div className="flex-1 relative h-3 select-none">
              {masterMonthLabels.map((item, idx) => (
                <div
                  key={idx}
                  className="absolute whitespace-nowrap font-semibold"
                  style={{ left: `${(item.weekIndex / 53) * 100}%` }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Joined Year Charts (Stacked seamlessly with matching week columns) */}
          <div className="space-y-1.5 sm:space-y-2">
            {displayedYears.map((yearData, yIdx) => {
              return (
                <div
                  key={yearData.year}
                  className={`flex items-center gap-1 sm:gap-1.5 ${
                    yIdx > 0 ? 'pt-1.5 sm:pt-2 border-t border-line/30' : ''
                  }`}
                >
                  {/* Left Column: Shrunk Year Badge & Stats */}
                  <div className="w-9 sm:w-11 shrink-0 text-left pr-0.5">
                    <span className="text-[11px] sm:text-xs font-semibold text-chalk block leading-none">
                      {yearData.year}
                    </span>
                    <span className="text-[9px] text-ash tabular-nums block leading-none mt-1" title={`${yearData.workoutCount} workouts`}>
                      {yearData.workoutCount}w
                    </span>
                  </div>

                  {/* Day of week labels */}
                  <div className="flex flex-col gap-[1px] text-[9px] font-semibold text-ash justify-between py-0.5 select-none shrink-0 w-2 text-center">
                    {dayNames.map((name, i) => (
                      <span key={i} className="leading-none text-center">
                        {i % 2 === 1 ? name : ''}
                      </span>
                    ))}
                  </div>

                  {/* 52-53 Week Grid Columns: Full width grid eliminating all dead/empty space */}
                  <div className="flex-1 grid grid-cols-[repeat(53,minmax(0,1fr))] gap-[1px] sm:gap-[2px] min-w-0 items-center">
                    {yearData.weeks.map((week, wIdx) => (
                      <div key={wIdx} className="flex flex-col gap-[1px] sm:gap-[2px] min-w-0">
                        {week.map((day, dIdx) => {
                          const hasWorkout = day.workouts.length > 0;

                          if (!day.isInYear) {
                            return (
                              <div
                                key={dIdx}
                                className="w-full aspect-square rounded-[3px] sm:rounded-[4px] opacity-10 bg-raised/20"
                              />
                            );
                          }

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
                              className={`w-full aspect-square rounded-[3px] sm:rounded-[4px] border cursor-pointer outline-none transition-colors touch-manipulation ${
                                hasWorkout
                                  ? 'hover:ring-2 hover:ring-plate hover:ring-offset-1 hover:ring-offset-surface'
                                  : 'cursor-default'
                              } ${getHeatmapColor(day.workouts)}`}
                              aria-label={`${day.dateStr}: ${day.workouts.length} workout(s)`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Legend */}
      <div className="flex items-center gap-4 text-[11px] flex-wrap pt-2.5 border-t border-line text-dust">
        <div className="flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded-[4px] ${theme === 'light' ? 'bg-raised border border-line' : 'bg-raised/70 border border-line-strong/50'}`} title="0 workouts (Rest)"></span>
          <span>Rest day</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[4px] bg-plate border border-plate" title="Workout logged"></span>
          <span className="text-chalk">Workout logged</span>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredDay && (
        <div
          className={`fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 text-xs rounded-lg py-2 px-3 shadow-2xl border min-w-[190px] max-w-[calc(100vw-32px)] animate-in fade-in ${
            theme === 'light'
              ? 'bg-surface text-chalk border-line shadow-lg'
              : 'bg-raised text-white border-line-strong'
          }`}
          style={{
            left: `${typeof window !== 'undefined' ? Math.max(105, Math.min(window.innerWidth - 105, hoveredDay.x)) : hoveredDay.x}px`,
            top: `${hoveredDay.y}px`
          }}
        >
          <div className="font-semibold text-[11px] text-dust">
            {fromDateKey(hoveredDay.dateStr).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
          {hoveredDay.dayWorkouts.length === 0 ? (
            <div className="text-ash text-[11px] mt-0.5">Rest / Recovery day</div>
          ) : (
            <div className="mt-1 space-y-1.5">
              {hoveredDay.dayWorkouts.map((w, idx) => (
                <div key={idx} className="border-t border-line pt-1 first:border-0 first:pt-0">
                  <div className="font-semibold text-chalk text-xs leading-snug">{w.title}</div>
                  <div className="text-[11px] text-plate flex items-center gap-1.5 mt-0.5 tabular-nums font-mono">
                    <span>
                      {(unit === 'kg' ? w.totalVolumeKg : w.totalVolumeLbs).toLocaleString()} {unit}
                    </span>
                    <span aria-hidden="true" className="text-ash">·</span>
                    <span className="font-sans text-chalk-2">{w.durationMinutes} min</span>
                    <span aria-hidden="true" className="text-ash">·</span>
                    <span className="font-sans text-chalk-2">{w.exercises.length} exs</span>
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
