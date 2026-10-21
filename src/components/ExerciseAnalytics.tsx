import React, { useState, useMemo, useRef } from 'react';
import { ExerciseStats, UnitPreference, MuscleGroup } from '../types/workout';
import { MUSCLE_COLORS } from '../utils/muscleTaxonomy';
import { Search, Trophy, TrendingUp, Calendar } from 'lucide-react';

interface ExerciseAnalyticsProps {
  exerciseStats: Record<string, ExerciseStats>;
  unit: UnitPreference;
  initialSelectedExercise?: string;
}

export const ExerciseAnalytics: React.FC<ExerciseAnalyticsProps> = ({
  exerciseStats,
  unit,
  initialSelectedExercise,
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
  const [metricMode, setMetricMode] = useState<'1rm' | 'weight' | 'volume'>('1rm');
  
  // Single active point index for jitter-free crosshair tracking
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const chartSvgRef = useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    if (initialSelectedExercise && exerciseStats[initialSelectedExercise]) {
      setSelectedTitle(initialSelectedExercise);
    }
  }, [initialSelectedExercise, exerciseStats]);

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

  // Handle smooth mouse movement across chart area
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

  const handleChartMouseLeave = () => {
    setActivePointIndex(null);
  };

  const activeCoord = chartData && activePointIndex !== null ? chartData.coords[activePointIndex] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left Column: Exercise Search & Directory */}
      <div className="lg:col-span-4 bg-[#131D31] rounded-2xl border border-[#1E293B] shadow-sm p-4 flex flex-col h-[700px]">
        <div className="mb-3">
          <h2 className="text-sm font-bold text-[#F8FAFC] mb-2 flex items-center justify-between">
            <span>Exercise Library</span>
            <span className="text-xs text-[#94A3B8] font-normal font-mono tabular-nums">
              {filteredExercises.length} items
            </span>
          </h2>

          {/* Search box */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Filter exercises..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6]"
            />
          </div>

          {/* Muscle filter pills */}
          <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            <button
              onClick={() => setSelectedMuscle('all')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedMuscle === 'all'
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              All
            </button>
            {availableMuscles.map(m => (
              <button
                key={m}
                onClick={() => setSelectedMuscle(m)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedMuscle === m
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Exercises List */}
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
                className={`w-full text-left p-2.5 rounded-xl transition-all border flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'bg-[#1E3A8A]/40 border-[#3B82F6]/60 text-[#F8FAFC] shadow-[0_0_12px_rgba(37,99,235,0.2)]'
                    : 'bg-[#0B0F17]/40 border-transparent hover:bg-[#1E293B]/60 hover:border-[#1E293B]'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-bold text-xs truncate text-[#F8FAFC]">
                    {ex.exerciseTitle}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#94A3B8] mt-0.5">
                    <span className={`font-semibold ${muscleColor.text}`}>{ex.muscleGroup}</span>
                    <span aria-hidden="true" className="text-[#475569]">·</span>
                    <span>{ex.totalSets} sets</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-extrabold text-[#F8FAFC] tabular-nums font-mono">
                    {topWeight > 0 ? `${topWeight} ${unit}` : 'BW'}
                  </div>
                  <div className="text-[10px] text-[#38BDF8] tabular-nums font-mono">
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
          <div className="bg-[#131D31] rounded-2xl p-5 border border-[#1E293B] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${MUSCLE_COLORS[currentExercise.muscleGroup].bg} ${MUSCLE_COLORS[currentExercise.muscleGroup].text} border ${MUSCLE_COLORS[currentExercise.muscleGroup].border}`}>
                    {currentExercise.muscleGroup}
                  </span>
                  {currentExercise.secondaryMuscle && (
                    <span className="text-xs text-[#94A3B8]">
                      + {currentExercise.secondaryMuscle}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#F8FAFC] mt-1.5">
                  {currentExercise.exerciseTitle}
                </h2>
                <div className="text-xs text-[#94A3B8] mt-1 flex items-center gap-2">
                  <span>First logged: {currentExercise.firstPerformed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span aria-hidden="true" className="text-[#475569]">·</span>
                  <span>Latest: {currentExercise.lastPerformed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Rep Max Snapshot */}
              <div className="bg-[#0B0F17] p-3 rounded-xl border border-[#1E293B] flex items-center gap-4">
                <div className="text-center">
                  <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">Top Weight</div>
                  <div className="text-base font-extrabold text-[#F8FAFC] tabular-nums font-mono">
                    {unit === 'kg' ? currentExercise.allTimeMaxWeightKg : currentExercise.allTimeMaxWeightLbs} <span className="text-xs font-normal text-[#94A3B8]">{unit}</span>
                  </div>
                </div>
                <div className="h-7 w-[1px] bg-[#1E293B]" />
                <div className="text-center">
                  <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">Estimated 1RM</div>
                  <div className="text-base font-extrabold text-[#38BDF8] tabular-nums font-mono">
                    {unit === 'kg' ? currentExercise.allTimeEstimated1RMKg : currentExercise.allTimeEstimated1RMLbs} <span className="text-xs font-normal text-[#94A3B8]">{unit}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rep Max Table */}
            <div className="mt-4 pt-4 border-t border-[#1E293B]">
              <div className="text-xs font-bold text-[#94A3B8] mb-2 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#38BDF8]" />
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
                  <div key={label} className="bg-[#0B0F17] rounded-xl p-2.5 border border-[#1E293B] text-center">
                    <div className="text-[10px] font-bold text-[#64748B]">{label}</div>
                    <div className="text-sm font-extrabold text-[#F8FAFC] tabular-nums font-mono mt-0.5">
                      {rec ? (unit === 'kg' ? rec.weightKg : rec.weightLbs) : '—'}{' '}
                      {rec && <span className="text-[10px] font-normal text-[#94A3B8]">{unit}</span>}
                    </div>
                    {rec ? (
                      <div className="text-[10px] text-[#38BDF8] mt-0.5 truncate">
                        {rec.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    ) : (
                      <div className="text-[10px] text-[#475569] mt-0.5">Not set</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Progression Graph Card */}
          <div className="bg-[#131D31] rounded-2xl p-5 border border-[#1E293B] shadow-sm relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#38BDF8]" />
                  Progress Over Time
                </h3>
                <div className="text-xs text-[#94A3B8] mt-0.5">
                  Chronological progression across all {currentExercise.history.length} logged sessions
                </div>
              </div>

              {/* Metric Mode Switcher */}
              <div className="flex items-center gap-1 bg-[#0B0F17] p-1 rounded-xl border border-[#1E293B] text-xs font-semibold">
                <button
                  onClick={() => setMetricMode('1rm')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    metricMode === '1rm' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  Est. 1RM
                </button>
                <button
                  onClick={() => setMetricMode('weight')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    metricMode === 'weight' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  Top Weight
                </button>
                <button
                  onClick={() => setMetricMode('volume')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    metricMode === 'volume' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
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
                    className="w-full h-full overflow-visible cursor-crosshair select-none"
                    viewBox="0 0 700 240"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="chartGradientBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Y-axis gridlines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                      const y = 20 + (1 - pct) * 190;
                      const val = Math.round(chartData.yMin + pct * (chartData.yMax - chartData.yMin));
                      return (
                        <g key={idx}>
                          <line x1="40" y1={y} x2="690" y2={y} stroke="#1E293B" strokeDasharray="3 3" />
                          <text x="35" y={y + 4} textAnchor="end" fontSize="10" fill="#64748B" fontFamily="monospace">
                            {val}
                          </text>
                        </g>
                      );
                    })}

                    {/* Polyline and Gradient Area */}
                    {(() => {
                      const coords = chartData.coords;
                      const n = coords.length;
                      if (n === 1) {
                        return (
                          <circle cx={coords[0].x} cy={coords[0].y} r="6" fill="#3B82F6" />
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
                            stroke="#38BDF8"
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
                              fill="#0B0F17"
                              stroke="#38BDF8"
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
                                stroke="#38BDF8"
                                strokeWidth="1.5"
                                strokeDasharray="3 3"
                                opacity="0.75"
                              />
                              <circle
                                cx={activeCoord.x}
                                cy={activeCoord.y}
                                r="6.5"
                                fill="#38BDF8"
                                stroke="#FFFFFF"
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
                <div className="flex justify-between text-[11px] text-[#64748B] mt-2 px-10">
                  <span>{chartData.points[0]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span>{chartData.points[chartData.points.length - 1]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-[#64748B]">
                Not enough history points to chart.
              </div>
            )}

            {/* Stable Tooltip pinned to activeCoord */}
            {activeCoord && (
              <div
                className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-full bg-[#0F172A] text-white text-xs rounded-xl py-2 px-3 shadow-2xl border border-[#334155] min-w-[190px]"
                style={{
                  left: `${(activeCoord.x / 700) * 100}%`,
                  top: '60px',
                }}
              >
                <div className="font-semibold text-[11px] text-[#94A3B8]">
                  {activeCoord.pt.date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <div className="font-bold text-sm text-[#F8FAFC] mt-0.5 truncate">
                  {activeCoord.pt.workoutTitle}
                </div>
                <div className="text-[11px] text-[#38BDF8] font-mono tabular-nums font-semibold mt-1">
                  {activeCoord.pt.weight} {unit} × {activeCoord.pt.reps} reps
                </div>
                <div className="text-[10px] text-[#94A3B8]">
                  Est. 1RM: {activeCoord.pt.val} {unit} · Session #{activeCoord.idx + 1} of {chartData?.points.length}
                </div>
              </div>
            )}
          </div>

          {/* Session History Log Table */}
          <div className="bg-[#131D31] rounded-2xl p-5 border border-[#1E293B] shadow-sm">
            <h3 className="text-sm font-bold text-[#F8FAFC] mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#38BDF8]" />
              Historical Sessions Log ({currentExercise.history.length} logged sessions)
            </h3>
            <div className="divide-y divide-[#1E293B] max-h-64 overflow-y-auto">
              {[...currentExercise.history].reverse().map((h, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-xs hover:bg-[#1E293B]/40 px-2 rounded-lg transition-colors">
                  <div>
                    <div className="font-bold text-[#F8FAFC]">{h.workoutTitle}</div>
                    <div className="text-[11px] text-[#94A3B8]">
                      {h.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-[#F8FAFC] tabular-nums font-mono">
                      {unit === 'kg' ? h.bestWeightKg : h.bestWeightLbs} {unit} × {h.bestReps}
                    </div>
                    <div className="text-[10px] text-[#38BDF8] tabular-nums font-mono">
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
