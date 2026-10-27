import React, { useState, useMemo, useRef } from 'react';
import { ExerciseStats, UnitPreference, MuscleGroup } from '../types/workout';
import { MUSCLE_COLORS } from '../utils/muscleTaxonomy';
import { Search, Trophy, TrendingUp, Calendar, ChevronDown } from 'lucide-react';

interface ExerciseAnalyticsProps {
  exerciseStats: Record<string, ExerciseStats>;
  unit: UnitPreference;
  initialSelectedExercise?: string;
  theme?: 'dark' | 'light';
}

export const ExerciseAnalytics: React.FC<ExerciseAnalyticsProps> = ({
  exerciseStats,
  unit,
  initialSelectedExercise,
  theme = 'dark',
}) => {
  const exercisesList = useMemo(() => {
    return Object.values(exerciseStats).sort((a, b) => b.totalSets - a.totalSets);
  }, [exerciseStats]);

  const [selectedTitle, setSelectedTitle] = useState<string>(() => {
    if (initialSelectedExercise && exerciseStats[initialSelectedExercise]) {
      return initialSelectedExercise;
    }
    return exercisesList[0]?.exerciseTitle || '';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [isMuscleMenuOpen, setIsMuscleMenuOpen] = useState(false);
  const muscleMenuRef = useRef<HTMLDivElement>(null);
  const muscleTriggerRef = useRef<HTMLButtonElement>(null);
  const muscleListRef = useRef<HTMLDivElement>(null);
  const [metricMode, setMetricMode] = useState<'1rm' | 'weight' | 'volume'>('1rm');
  
  // Single active point index for jitter-free crosshair tracking
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const chartSvgRef = useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    if (initialSelectedExercise && exerciseStats[initialSelectedExercise]) {
      setSelectedTitle(initialSelectedExercise);
    }
  }, [initialSelectedExercise, exerciseStats]);

  React.useEffect(() => {
    if (!isMuscleMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (muscleMenuRef.current && !muscleMenuRef.current.contains(event.target as Node)) {
        setIsMuscleMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMuscleMenuOpen(false);
        muscleTriggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMuscleMenuOpen]);

  // Move focus into the listbox when it opens so arrow keys work immediately.
  React.useEffect(() => {
    if (!isMuscleMenuOpen) return;
    const options = muscleListRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]');
    if (!options?.length) return;
    const selected = muscleListRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]');
    (selected ?? options[0]).focus();
  }, [isMuscleMenuOpen]);

  const handleMuscleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const options = Array.from(
      muscleListRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []
    );
    if (options.length === 0) return;
    const current = options.indexOf(document.activeElement as HTMLButtonElement);
    let next: number | null = null;

    if (event.key === 'ArrowDown') next = current < 0 ? 0 : (current + 1) % options.length;
    else if (event.key === 'ArrowUp') next = current <= 0 ? options.length - 1 : current - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = options.length - 1;
    else if (event.key === 'Tab') {
      setIsMuscleMenuOpen(false);
      return;
    }

    if (next !== null) {
      event.preventDefault();
      options[next].focus();
    }
  };

  const availableMuscles = useMemo(() => {
    const set = new Set<string>();
    exercisesList.forEach(e => set.add(e.muscleGroup));
    return Array.from(set).sort();
  }, [exercisesList]);

  const filteredExercises = useMemo(() => {
    return exercisesList.filter(e => {
      const matchSearch = e.exerciseTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMuscle = selectedMuscle === 'all' || e.muscleGroup === selectedMuscle;
      return matchSearch && matchMuscle;
    });
  }, [exercisesList, searchTerm, selectedMuscle]);

  const currentExercise: ExerciseStats | undefined = exerciseStats[selectedTitle] || exercisesList[0];

  const chartData = useMemo(() => {
    if (!currentExercise || currentExercise.history.length === 0) return null;

    const points = currentExercise.history.map(pt => {
      let val = 0;
      if (metricMode === '1rm') val = unit === 'kg' ? pt.estimated1RMKg : pt.estimated1RMLbs;
      else if (metricMode === 'weight') val = unit === 'kg' ? pt.bestWeightKg : pt.bestWeightLbs;
      else val = unit === 'kg' ? pt.totalVolumeKg : pt.totalVolumeLbs;

      return {
        date: pt.date,
        val,
        weight: unit === 'kg' ? pt.bestWeightKg : pt.bestWeightLbs,
        reps: pt.bestReps,
        workoutTitle: pt.workoutTitle,
      };
    });

    const values = points.map(p => p.val);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const padding = (maxVal - minVal) * 0.15 || 5;

    const yMin = Math.max(0, Math.floor(minVal - padding));
    const yMax = Math.ceil(maxVal + padding);

    // Compute coordinates for SVG viewBox="0 0 700 240"
    const n = points.length;
    const coords = points.map((pt, idx) => {
      const x = n === 1 ? 350 : 50 + (idx / (n - 1)) * 630;
      const range = yMax - yMin || 1;
      const y = 20 + (1 - (pt.val - yMin) / range) * 190;
      return { x, y, pt, idx };
    });

    return {
      points,
      coords,
      yMin,
      yMax,
    };
  }, [currentExercise, metricMode, unit]);

  // Handle smooth mouse and touch movement across chart area
  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartData || chartData.coords.length === 0 || !chartSvgRef.current) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const scaleX = 700 / rect.width;
    const svgX = mouseX * scaleX;

    // Find nearest point
    let closestIdx = 0;
    let closestDist = Infinity;
    chartData.coords.forEach((c, i) => {
      const dist = Math.abs(c.x - svgX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    });

    setActivePointIndex(closestIdx);
  };

  const handleChartTouch = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!chartData || chartData.coords.length === 0 || !chartSvgRef.current || !e.touches[0]) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const scaleX = 700 / rect.width;
    const svgX = touchX * scaleX;

    let closestIdx = 0;
    let closestDist = Infinity;
    chartData.coords.forEach((c, i) => {
      const dist = Math.abs(c.x - svgX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    });

    setActivePointIndex(closestIdx);
  };

  const handleChartMouseLeave = () => {
    setActivePointIndex(null);
  };

  const activeCoord = chartData && activePointIndex !== null ? chartData.coords[activePointIndex] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
      {/* Left Column: Exercise Search & Directory */}
      <div className="lg:col-span-4 bg-surface rounded-xl border border-line shadow-sm p-3.5 sm:p-4 flex flex-col h-[280px] sm:h-[380px] lg:h-[700px]">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-chalk mb-2 flex items-center justify-between">
            <span>Exercise Library</span>
            <span className="text-xs text-dust font-normal font-mono tabular-nums">
              {filteredExercises.length} items
            </span>
          </h2>

          {/* Search box + muscle filter */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 text-ash absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                aria-label="Filter exercises by name"
                placeholder="Filter exercises"
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-void border border-line rounded-lg text-chalk placeholder:text-ash focus:border-plate focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-plate transition-colors"
              />
            </div>

            <div ref={muscleMenuRef} className="relative shrink-0">
              <button
                ref={muscleTriggerRef}
                type="button"
                onClick={() => setIsMuscleMenuOpen(open => !open)}
                onKeyDown={e => {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    setIsMuscleMenuOpen(true);
                  }
                }}
                aria-haspopup="listbox"
                aria-expanded={isMuscleMenuOpen}
                aria-controls="muscle-listbox"
                aria-label={`Muscle filter: ${
                  selectedMuscle === 'all' ? 'all muscles' : selectedMuscle
                }`}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-raised text-chalk-2 border transition-colors duration-150 hover:border-line-strong ${
                  isMuscleMenuOpen ? 'border-plate/60 text-chalk' : 'border-line'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`w-1.5 h-1.5 rounded-full ${
                    selectedMuscle === 'all'
                      ? 'bg-chalk-2'
                      : MUSCLE_COLORS[selectedMuscle as keyof typeof MUSCLE_COLORS]?.bar ?? 'bg-chalk-2'
                  }`}
                />
                <span className="truncate max-w-24">
                  {selectedMuscle === 'all' ? 'All muscles' : selectedMuscle}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-ash duration-150 ${
                    isMuscleMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isMuscleMenuOpen && (
                <div
                  id="muscle-listbox"
                  ref={muscleListRef}
                  role="listbox"
                  tabIndex={-1}
                  aria-label="Filter by muscle group"
                  onKeyDown={handleMuscleMenuKeyDown}
                  className="animate-menu-in absolute right-0 top-full mt-1 z-20 w-44 max-h-64 overflow-y-auto rounded-lg border border-line bg-surface shadow-xl p-1"
                >
                  {['all', ...availableMuscles].map(m => {
                    const isActive = selectedMuscle === m;
                    const dot =
                      m === 'all'
                        ? 'bg-chalk-2'
                        : MUSCLE_COLORS[m as keyof typeof MUSCLE_COLORS]?.bar ?? 'bg-chalk-2';
                    return (
                      <button
                        key={m}
                        type="button"
                        role="option"
                        tabIndex={-1}
                        aria-selected={isActive}
                        onClick={() => {
                          setSelectedMuscle(m);
                          setIsMuscleMenuOpen(false);
                          muscleTriggerRef.current?.focus();
                        }}
                        className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-raised text-chalk'
                            : 'text-dust hover:bg-raised hover:text-chalk'
                        }`}
                      >
                        <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                        <span className="truncate">{m === 'all' ? 'All muscles' : m}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Exercises List: square-y items with micro-interactions */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filteredExercises.map(ex => {
            const isSelected = ex.exerciseTitle === currentExercise?.exerciseTitle;
            const topWeight = unit === 'kg' ? ex.allTimeMaxWeightKg : ex.allTimeMaxWeightLbs;
            const top1RM = unit === 'kg' ? ex.allTimeEstimated1RMKg : ex.allTimeEstimated1RMLbs;
            const muscleColor = MUSCLE_COLORS[ex.muscleGroup] || MUSCLE_COLORS['Full Body'];

            return (
              <button
                key={ex.exerciseTitle}
                onClick={() => setSelectedTitle(ex.exerciseTitle)}
                className={`w-full text-left p-2.5 rounded-lg transition-colors duration-150 border flex items-center justify-between gap-2 active:scale-[0.99] ${
                  isSelected
                    ? 'bg-tint-plate/50 border-plate/50 text-chalk shadow-sm'
                    : 'bg-void/40 border-transparent hover:bg-raised/60 hover:border-line'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-xs truncate text-chalk">
                    {ex.exerciseTitle}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-dust mt-0.5">
                    <span className={`font-semibold ${muscleColor.text}`}>{ex.muscleGroup}</span>
                    <span aria-hidden="true" className="text-ash">·</span>
                    <span>{ex.totalSets} sets</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-semibold text-chalk tabular-nums font-mono">
                    {topWeight > 0 ? `${topWeight} ${unit}` : 'BW'}
                  </div>
                  <div className="text-[10px] text-plate tabular-nums font-mono">
                    1RM: {top1RM}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Selected Exercise Deep Dive & Progression */}
      {currentExercise ? (
        <div className="lg:col-span-8 space-y-4">
          {/* Header Card */}
          <div className="bg-surface rounded-xl p-5 border border-line shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${MUSCLE_COLORS[currentExercise.muscleGroup].bg} ${MUSCLE_COLORS[currentExercise.muscleGroup].text} border ${MUSCLE_COLORS[currentExercise.muscleGroup].border}`}>
                    {currentExercise.muscleGroup}
                  </span>
                  {currentExercise.secondaryMuscle && (
                    <span className="text-xs text-dust">
                      + {currentExercise.secondaryMuscle}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-chalk mt-1.5">
                  {currentExercise.exerciseTitle}
                </h2>
                <div className="text-xs text-dust mt-1 flex items-center gap-2">
                  <span>First logged: {currentExercise.firstPerformed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span aria-hidden="true" className="text-ash">·</span>
                  <span>Latest: {currentExercise.lastPerformed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Rep Max Snapshot */}
              <div className="bg-void p-3 rounded-lg border border-line flex items-center gap-4">
                <div className="text-center">
                  <div className="text-[10px] font-semibold text-dust uppercase tracking-wider">Top Weight</div>
                  <div className="text-base font-semibold text-chalk tabular-nums font-mono">
                    {unit === 'kg' ? currentExercise.allTimeMaxWeightKg : currentExercise.allTimeMaxWeightLbs} <span className="text-xs font-normal text-dust">{unit}</span>
                  </div>
                </div>
                <div className="h-7 w-[1px] bg-raised" />
                <div className="text-center">
                  <div className="text-[10px] font-semibold text-dust uppercase tracking-wider">Estimated 1RM</div>
                  <div className="text-base font-semibold text-plate tabular-nums font-mono">
                    {unit === 'kg' ? currentExercise.allTimeEstimated1RMKg : currentExercise.allTimeEstimated1RMLbs} <span className="text-xs font-normal text-dust">{unit}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rep Max Table */}
            <div className="mt-4 pt-4 border-t border-line">
              <div className="text-xs font-semibold text-dust mb-2 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-plate" />
                All-Time Rep Max Records
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { label: '1RM', rec: currentExercise.repMaxRecords.oneRM },
                  { label: '3RM', rec: currentExercise.repMaxRecords.threeRM },
                  { label: '5RM', rec: currentExercise.repMaxRecords.fiveRM },
                  { label: '8RM', rec: currentExercise.repMaxRecords.eightRM },
                  { label: '10RM', rec: currentExercise.repMaxRecords.tenRM },
                ].map(({ label, rec }) => (
                  <div key={label} className="bg-void rounded-lg p-2.5 border border-line text-center">
                    <div className="text-[10px] font-semibold text-ash">{label}</div>
                    <div className="text-sm font-semibold text-chalk tabular-nums font-mono mt-0.5">
                      {rec ? (unit === 'kg' ? rec.weightKg : rec.weightLbs) : '—'}{' '}
                      {rec && <span className="text-[10px] font-normal text-dust">{unit}</span>}
                    </div>
                    {rec ? (
                      <div className="text-[10px] text-plate mt-0.5 truncate">
                        {rec.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    ) : (
                      <div className="text-[10px] text-ash mt-0.5">Not set</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Progression Graph Card */}
          <div className="bg-surface rounded-xl p-5 border border-line shadow-sm relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-chalk flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-plate" />
                  Progress Over Time
                </h3>
                <div className="text-xs text-dust mt-0.5">
                  Chronological progression across all {currentExercise.history.length} logged sessions
                </div>
              </div>

              {/* Metric Mode Switcher: Square-y buttons */}
              <div className="flex items-center gap-1 bg-void p-0.5 rounded-lg border border-line text-xs font-semibold">
                <button
                  onClick={() => setMetricMode('1rm')}
                  className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors duration-150 ${
                    metricMode === '1rm' ? 'bg-raised text-chalk shadow-sm' : 'text-dust hover:text-chalk'
                  }`}
                >
                  Est. 1RM
                </button>
                <button
                  onClick={() => setMetricMode('weight')}
                  className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors duration-150 ${
                    metricMode === 'weight' ? 'bg-raised text-chalk shadow-sm' : 'text-dust hover:text-chalk'
                  }`}
                >
                  Top Weight
                </button>
                <button
                  onClick={() => setMetricMode('volume')}
                  className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors duration-150 ${
                    metricMode === 'volume' ? 'bg-raised text-chalk shadow-sm' : 'text-dust hover:text-chalk'
                  }`}
                >
                  Volume
                </button>
              </div>
            </div>

            {/* Jitter-Free Interactive Chart */}
            {chartData && chartData.points.length > 0 ? (
              <div className="relative pt-2">
                <div className="h-64 w-full relative">
                  <svg
                    ref={chartSvgRef}
                    onMouseMove={handleChartMouseMove}
                    onMouseLeave={handleChartMouseLeave}
                    onTouchStart={handleChartTouch}
                    onTouchMove={handleChartTouch}
                    onTouchEnd={handleChartMouseLeave}
                    className="w-full h-full overflow-visible cursor-crosshair select-none touch-none"
                    viewBox="0 0 700 240"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="chartGradientBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" style={{ stopColor: 'var(--color-plate)' }} stopOpacity="0.34" />
                        <stop offset="100%" style={{ stopColor: 'var(--color-plate)' }} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Y-axis gridlines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                      const y = 20 + (1 - pct) * 190;
                      const val = Math.round(chartData.yMin + pct * (chartData.yMax - chartData.yMin));
                      return (
                        <g key={idx}>
                          <line x1="40" y1={y} x2="690" y2={y} style={{ stroke: 'var(--color-line)' }} strokeDasharray="3 3" />
                          <text x="35" y={y + 4} textAnchor="end" fontSize="10" fill="var(--color-ash)" fontFamily="monospace">
                            {val}
                          </text>
                        </g>
                      );
                    })}

                    {/* Polyline and Gradient Area */}
                    {(() => {
                      const coords = chartData.coords;
                      const n = coords.length;
                      const strokeColor = 'var(--color-plate)';
                      const dotBg = 'var(--color-surface)';

                      if (n === 1) {
                        return (
                          <circle cx={coords[0].x} cy={coords[0].y} r="6" fill={strokeColor} />
                        );
                      }

                      const pointsString = coords.map(c => `${c.x},${c.y}`).join(' ');
                      const areaString = `50,210 ${pointsString} ${coords[n - 1].x},210`;

                      return (
                        <>
                          <polygon points={areaString} fill="url(#chartGradientBlue)" />
                          <polyline
                            points={pointsString}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Base points: smooth, fixed, zero transform jitter */}
                          {coords.map((c, i) => (
                            <circle
                              key={i}
                              cx={c.x}
                              cy={c.y}
                              r="3.5"
                              fill={dotBg}
                              stroke={strokeColor}
                              strokeWidth="2"
                              className="pointer-events-none"
                            />
                          ))}

                          {/* Active hover vertical crosshair line and highlighted dot */}
                          {activeCoord && (
                            <g className="pointer-events-none">
                              <line
                                x1={activeCoord.x}
                                y1="20"
                                x2={activeCoord.x}
                                y2="210"
                                stroke={strokeColor}
                                strokeWidth="1.5"
                                strokeDasharray="3 3"
                                opacity="0.75"
                              />
                              <circle
                                cx={activeCoord.x}
                                cy={activeCoord.y}
                                r="6.5"
                                fill={strokeColor}
                                style={{ stroke: 'var(--color-surface)' }}
                                strokeWidth="2.5"
                              />
                            </g>
                          )}
                        </>
                      );
                    })()}

                    {/* Transparent overlay rect to capture all mouse events smoothly */}
                    <rect
                      x="40"
                      y="15"
                      width="650"
                      height="200"
                      fill="transparent"
                      className="cursor-crosshair"
                    />
                  </svg>
                </div>

                {/* X-axis date range */}
                <div className="flex justify-between text-[11px] text-ash mt-2 px-10">
                  <span>{chartData.points[0]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span>{chartData.points[chartData.points.length - 1]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-ash">
                Not enough history points to chart.
              </div>
            )}

            {/* Stable Tooltip pinned to activeCoord: square-y and themed */}
            {activeCoord && (
              <div
                className={`absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-full text-xs rounded-lg py-2 px-3 shadow-2xl border min-w-[190px] ${
                  theme === 'light'
                    ? 'bg-surface text-chalk border-line shadow-lg'
                    : 'bg-raised text-white border-line-strong'
                }`}
                style={{
                  left: `${Math.min(80, Math.max(20, (activeCoord.x / 700) * 100))}%`,
                  top: '60px',
                }}
              >
                <div className="font-semibold text-[11px] text-dust">
                  {activeCoord.pt.date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <div className="font-semibold text-sm text-chalk mt-0.5 truncate">
                  {activeCoord.pt.workoutTitle}
                </div>
                <div className="text-[11px] text-plate font-mono tabular-nums font-semibold mt-1">
                  {activeCoord.pt.weight} {unit} × {activeCoord.pt.reps} reps
                </div>
                <div className="text-[10px] text-dust">
                  Est. 1RM: {activeCoord.pt.val} {unit} · Session #{activeCoord.idx + 1} of {chartData?.points.length}
                </div>
              </div>
            )}
          </div>

          {/* Session History Log Table */}
          <div className="bg-surface rounded-xl p-5 border border-line shadow-sm">
            <h3 className="text-sm font-semibold text-chalk mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-plate" />
              Historical Sessions Log ({currentExercise.history.length} logged sessions)
            </h3>
            <div className="divide-y divide-line max-h-64 overflow-y-auto">
              {[...currentExercise.history].reverse().map((h, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-xs hover:bg-raised/40 px-2 rounded-lg transition-colors">
                  <div>
                    <div className="font-semibold text-chalk">{h.workoutTitle}</div>
                    <div className="text-[11px] text-dust">
                      {h.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-chalk tabular-nums font-mono">
                      {unit === 'kg' ? h.bestWeightKg : h.bestWeightLbs} {unit} × {h.bestReps}
                    </div>
                    <div className="text-[10px] text-plate tabular-nums font-mono">
                      1RM: {unit === 'kg' ? h.estimated1RMKg : h.estimated1RMLbs} {unit} · {h.totalSets} sets
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
