import React, { useState, useMemo, useRef } from 'react';
import { Workout, UnitPreference } from '../types/workout';
import { Flame, Calendar, ChevronLeft, ChevronRight, ChevronsRight, Maximize2, Minimize2 } from 'lucide-react';

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
      const key = w.startTime.toISOString().split('T')[0];
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
        const dateStr = dCopy.toISOString().split('T')[0];
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

  // Heatmap intensity: strictly gray for rest, and ONLY #2ba2fb on days you worked out
  const getHeatmapColor = (count: number) => {
    if (count === 0) {
      return theme === 'light'
        ? 'heat-cube-0 bg-[#E2E8F0] border-[#CBD5E1] hover:border-[#94A3B8]'
        : 'heat-cube-0 bg-[#1E293B]/60 border-[#334155]/40 hover:border-[#64748B]';
    }
    return 'heat-cube-workout bg-[#2ba2fb] border-[#1d8de0] hover:brightness-110 shadow-[0_0_5px_rgba(43,162,251,0.45)]';
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isFitToScreen, setIsFitToScreen] = useState<boolean>(true);

  const handleScroll = (distance: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: distance, behavior: 'smooth' });
    }
  };

  const scrollToQuarter = (quarter: 1 | 2 | 3 | 4) => {
    if (scrollRef.current) {
      // Q1: 0px, Q2: ~210px, Q3: ~420px, Q4: ~660px
      const offsets = { 1: 0, 2: 210, 3: 420, 4: 660 };
      scrollRef.current.scrollTo({ left: offsets[quarter], behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#131D31] rounded-2xl p-3.5 sm:p-5 border border-[#1E293B] shadow-sm relative space-y-3.5">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#38BDF8]" />
            <h2 className="text-sm sm:text-base font-bold text-[#F8FAFC]">
              Workout Activity & Consistency
            </h2>
          </div>
          <div className="text-xs text-[#94A3B8] mt-0.5">
            {selectedTab === 'all'
              ? `Unified All-Time Timeline · Continuous Jan–Dec Calendar`
              : `Calendar Year ${selectedTab} (Jan 1 – Dec 31)`}
          </div>
        </div>

        {/* Tab Controls, Streak, Shrink to Fit Toggle, & Year Selectors */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Shrink to Fit Toggle Button */}
          <button
            onClick={() => setIsFitToScreen(!isFitToScreen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all duration-150 hover:-translate-y-0.5 active:scale-95 shrink-0 ${
              isFitToScreen
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] bg-[#0B0F17] border border-[#1E293B]'
            }`}
            title={isFitToScreen ? "Shrink to Fit is ON (entire table fits screen). Click for Scroll mode." : "Switch to Shrink to Fit"}
          >
            {isFitToScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFitToScreen ? 'Shrink to Fit' : 'Scrollable'}</span>
          </button>

          <div className="flex items-center gap-1 bg-[#0B0F17] p-0.5 rounded-md border border-[#1E293B] text-xs font-semibold overflow-x-auto max-w-full">
            <button
              onClick={() => setSelectedTab('all')}
              className={`px-2.5 py-1 rounded-sm text-xs font-bold transition-all duration-150 hover:-translate-y-0.5 active:scale-95 shrink-0 ${
                selectedTab === 'all'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              All Time
            </button>
            {availableYears.map(yr => (
              <button
                key={yr}
                onClick={() => setSelectedTab(yr.toString())}
                className={`px-2.5 py-1 rounded-sm text-xs font-bold transition-all duration-150 hover:-translate-y-0.5 active:scale-95 shrink-0 ${
                  selectedTab === yr.toString()
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-[#1E3A8A]/30 text-[#60A5FA] rounded-md border border-[#2563EB]/40 font-semibold text-xs shrink-0">
            <Flame className="w-3.5 h-3.5 text-[#38BDF8] fill-[#38BDF8]" />
            <span>Best Streak: {totalStreakWeeks} wks</span>
          </div>
        </div>
      </div>

      {/* Quarter Quick-Jump & Horizontal Scroll Buttons Bar (only visible when in scroll mode) */}
      {!isFitToScreen && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#1E293B]/60 text-xs">
          <div className="flex items-center gap-1 text-[11px] text-[#94A3B8] flex-wrap">
            <span className="font-semibold text-[#64748B] mr-1">Timeline Jump:</span>
            <button
              onClick={() => scrollToQuarter(1)}
              className="px-2 py-0.5 rounded bg-[#0B0F17] hover:bg-[#1E293B] hover:text-[#38BDF8] text-[#CBD5E1] border border-[#1E293B] transition-colors"
            >
              Jan–Mar
            </button>
            <button
              onClick={() => scrollToQuarter(2)}
              className="px-2 py-0.5 rounded bg-[#0B0F17] hover:bg-[#1E293B] hover:text-[#38BDF8] text-[#CBD5E1] border border-[#1E293B] transition-colors"
            >
              Apr–Jun
            </button>
            <button
              onClick={() => scrollToQuarter(3)}
              className="px-2 py-0.5 rounded bg-[#0B0F17] hover:bg-[#1E293B] hover:text-[#38BDF8] text-[#CBD5E1] border border-[#1E293B] transition-colors"
            >
              Jul–Sep
            </button>
            <button
              onClick={() => scrollToQuarter(4)}
              className="px-2 py-0.5 rounded bg-[#0B0F17] hover:bg-[#1E293B] hover:text-[#38BDF8] text-[#CBD5E1] border border-[#1E293B] transition-colors"
            >
              Oct–Dec
            </button>
          </div>

          {/* Scroll Left / Right Buttons */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => handleScroll(-240)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#E2E8F0] bg-[#0B0F17] hover:bg-[#1E293B] hover:text-[#38BDF8] rounded-md border border-[#1E293B] transition-all active:scale-95 shadow-sm"
              title="Scroll earlier months (Left)"
              aria-label="Scroll earlier months"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="text-[11px]">Scroll Left</span>
            </button>
            <button
              onClick={() => handleScroll(240)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#E2E8F0] bg-[#0B0F17] hover:bg-[#1E293B] hover:text-[#38BDF8] rounded-md border border-[#1E293B] transition-all active:scale-95 shadow-sm"
              title="Scroll later months (Right)"
              aria-label="Scroll later months"
            >
              <span className="text-[11px]">Scroll Right</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#38BDF8]" />
            </button>
          </div>
        </div>
      )}

      {/* Unified Joined Calendar Container (Selector 1: shrinks to fit screen cleanly with zero wasted space) */}
      <div
        ref={scrollRef}
        className={
          isFitToScreen
            ? "w-full overflow-hidden rounded-xl border border-[#1E293B]/70 bg-[#0B0F17]/40 p-2 sm:p-2.5"
            : "overflow-x-auto pb-3 pt-2 touch-pan-x w-full custom-scrollbar rounded-xl border border-[#1E293B]/70 bg-[#0B0F17]/40 p-2 sm:p-2.5 scroll-smooth"
        }
      >
        <div className={isFitToScreen ? "w-full select-none" : "w-max min-w-[980px] select-none"}>
          {/* Shared Standardized Month Labels across the top */}
          {isFitToScreen ? (
            <div className="flex items-center gap-1 sm:gap-1.5 mb-1 text-[8px] sm:text-[9px] font-semibold text-[#64748B] select-none">
              <div className="w-9 sm:w-11 shrink-0" />
              <div className="w-2 shrink-0" />
              <div className="flex-1 relative h-3 select-none">
                {masterMonthLabels.map((item, idx) => (
                  <div
                    key={idx}
                    className="absolute whitespace-nowrap font-bold"
                    style={{ left: `${(item.weekIndex / 53) * 100}%` }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex text-[11px] font-semibold text-[#64748B] mb-1.5 relative h-3.5 select-none">
              {masterMonthLabels.map((item, idx) => (
                <div
                  key={idx}
                  className="absolute whitespace-nowrap font-bold"
                  style={{ left: `${item.weekIndex * 16 + 116}px` }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          )}

          {/* Joined Year Charts (Stacked seamlessly with matching week columns) */}
          <div className="space-y-1.5 sm:space-y-2">
            {displayedYears.map((yearData, yIdx) => {
              const volDisplay = unit === 'kg' ? yearData.volumeKg : yearData.volumeLbs;

              return (
                <div
                  key={yearData.year}
                  className={`flex items-center gap-1 sm:gap-1.5 ${
                    yIdx > 0 ? 'pt-1.5 sm:pt-2 border-t border-[#1E293B]/30' : ''
                  }`}
                >
                  {/* Left Column: Shrunk Year Badge & Stats */}
                  <div className="w-9 sm:w-11 shrink-0 text-left pr-0.5">
                    <span className="text-[11px] sm:text-xs font-bold text-[#F8FAFC] tracking-tighter block leading-none">
                      {yearData.year}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-[#38BDF8] font-mono block leading-none mt-0.5">
                      {yearData.workoutCount}w
                    </span>
                    <span className="text-[7px] sm:text-[8px] text-[#64748B] font-mono block truncate leading-none mt-0.5">
                      {volDisplay.toLocaleString()} {unit}
                    </span>
                  </div>

                  {/* Day of week labels */}
                  <div className="flex flex-col gap-[1px] text-[7px] sm:text-[8px] font-semibold text-[#64748B] justify-between py-0.5 select-none shrink-0 w-2 text-center">
                    {dayNames.map((name, i) => (
                      <span key={i} className="leading-none text-center">
                        {i % 2 === 1 ? name : ''}
                      </span>
                    ))}
                  </div>

                  {/* 52-53 Week Grid Columns: Full width grid eliminating all dead/empty space */}
                  <div className={isFitToScreen ? "flex-1 grid grid-cols-[repeat(53,minmax(0,1fr))] gap-[1px] sm:gap-[2px] min-w-0 items-center" : "flex gap-1 shrink-0"}>
                    {yearData.weeks.map((week, wIdx) => (
                      <div key={wIdx} className={isFitToScreen ? "flex flex-col gap-[1px] sm:gap-[2px] min-w-0" : "flex flex-col gap-1 shrink-0"}>
                        {week.map((day, dIdx) => {
                          const hasWorkout = day.workouts.length > 0;

                          if (!day.isInYear) {
                            return (
                              <div
                                key={dIdx}
                                className={
                                  isFitToScreen
                                    ? "w-full aspect-square rounded-[1px] sm:rounded-[2px] opacity-10 bg-[#1E293B]/20"
                                    : "w-3 h-3 rounded-[2.5px] opacity-10 bg-[#1E293B]/20"
                                }
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
                              className={`${
                                isFitToScreen
                                  ? "w-full aspect-square rounded-[1px] sm:rounded-[2px]"
                                  : "w-3 h-3 rounded-[2.5px]"
                              } border cursor-pointer outline-none transition-colors touch-manipulation ${
                                hasWorkout
                                  ? 'hover:ring-2 hover:ring-[#2ba2fb] hover:ring-offset-1 hover:ring-offset-[#131D31]'
                                  : 'cursor-default'
                              } ${getHeatmapColor(day.workouts.length)}`}
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
      <div className="flex items-center gap-4 text-[11px] flex-wrap pt-2.5 border-t border-[#1E293B] text-[#94A3B8]">
        <div className="flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded-[2px] ${theme === 'light' ? 'bg-[#E2E8F0] border border-[#CBD5E1]' : 'bg-[#1E293B]/70 border border-[#334155]/50'}`} title="0 workouts (Rest)"></span>
          <span>Rest day</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[2px] bg-[#2ba2fb] border border-[#1d8de0] shadow-[0_0_5px_rgba(43,162,251,0.5)]" title="Workout logged"></span>
          <span className="font-semibold text-[#F8FAFC]">Workout logged</span>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredDay && (
        <div
          className={`fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 text-xs rounded-md py-2 px-3 shadow-2xl border min-w-[190px] max-w-[calc(100vw-32px)] animate-in fade-in ${
            theme === 'light'
              ? 'bg-[#FAF6F0] text-[#2D2117] border-[#DAC6B2] shadow-[0_10px_25px_-5px_rgba(110,90,75,0.2)]'
              : 'bg-[#0F172A] text-white border-[#334155]'
          }`}
          style={{
            left: `${typeof window !== 'undefined' ? Math.max(105, Math.min(window.innerWidth - 105, hoveredDay.x)) : hoveredDay.x}px`,
            top: `${hoveredDay.y}px`
          }}
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
