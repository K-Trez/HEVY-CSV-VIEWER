import React, { useState, useMemo } from 'react';
import { Workout, UnitPreference } from '../types/workout';
import { Radar, Layers, Weight, Sparkles } from 'lucide-react';

interface MuscleRadarChartProps {
  workouts: Workout[];
  unit: UnitPreference;
  theme?: 'dark' | 'light';
  onSelectCategory?: (muscleName: string) => void;
}

interface RadarDimension {
  key: string;
  label: string;
  sets: number;
  volume: number;
  exerciseCount: number;
  exercises: string[];
}

export const MuscleRadarChart: React.FC<MuscleRadarChartProps> = ({
  workouts,
  unit,
  theme = 'dark',
  onSelectCategory,
}) => {
  const [metricMode, setMetricMode] = useState<'sets' | 'volume'>('sets');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Group workout data into exactly the 10 requested anatomical groups:
  // Chest, Back, Forearms, Biceps, Triceps, Core, Quads, Hams, Glutes, Calves
  const radarData: RadarDimension[] = useMemo(() => {
    const buckets: Record<string, { label: string; sets: number; volume: number; exercises: Set<string> }> = {
      chest: { label: 'Chest', sets: 0, volume: 0, exercises: new Set() },
      back: { label: 'Back', sets: 0, volume: 0, exercises: new Set() },
      forearms: { label: 'Forearms', sets: 0, volume: 0, exercises: new Set() },
      biceps: { label: 'Biceps', sets: 0, volume: 0, exercises: new Set() },
      triceps: { label: 'Triceps', sets: 0, volume: 0, exercises: new Set() },
      core: { label: 'Core', sets: 0, volume: 0, exercises: new Set() },
      quads: { label: 'Quads', sets: 0, volume: 0, exercises: new Set() },
      hams: { label: 'Hams', sets: 0, volume: 0, exercises: new Set() },
      glutes: { label: 'Glutes', sets: 0, volume: 0, exercises: new Set() },
      calves: { label: 'Calves', sets: 0, volume: 0, exercises: new Set() },
    };

    const getRadarKey = (m: string, title: string): string => {
      const t = title.toLowerCase();

      // 1. Forearms
      if (
        m === 'Forearms' ||
        /wrist curl|forearm|reverse curl|finger curl|grip|farmer|wrist roller|hand gripper|dead hang/i.test(t)
      ) {
        return 'forearms';
      }

      // 2. Chest
      if (
        m === 'Chest' ||
        /bench press|chest press|incline press|decline press|dumbbell press|chest fly|pec deck|cable fly|push.?up|dip/i.test(t)
      ) {
        return 'chest';
      }

      // 3. Back
      if (
        m === 'Back' ||
        /pull.?up|chin.?up|lat pulldown|pulldown|barbell row|dumbbell row|cable row|t-bar row|seated row|deadlift|rack pull|good morning|lat prayer|straight arm pulldown|shrug/i.test(t)
      ) {
        return 'back';
      }

      // 4. Biceps
      if (
        m === 'Biceps' ||
        /bicep|hammer curl|preacher curl|spider curl|concentration curl|incline curl|cable curl|ez bar curl|curl/i.test(t)
      ) {
        return 'biceps';
      }

      // 5. Triceps
      if (
        m === 'Triceps' ||
        /tricep|skull crusher|pushdown|french press|jm press|kickback|triceps extension|overhead tricep/i.test(t)
      ) {
        return 'triceps';
      }

      // 6. Calves
      if (
        m === 'Calves' ||
        /calf raise|calves|seated calf|standing calf|calf press|donkey calf/i.test(t)
      ) {
        return 'calves';
      }

      // 7. Core
      if (
        m === 'Core' ||
        /ab wheel|crunch|hanging leg raise|leg raise|plank|cable crunch|woodchopper|russian twist|sit.?up|hollow body|ab/i.test(t)
      ) {
        return 'core';
      }

      // 8. Quads
      if (
        m === 'Quads' ||
        /squat|front squat|hack squat|leg press|safety bar squat|leg extension|quad extension|lunge|split squat|bulgarian|step up/i.test(t)
      ) {
        return 'quads';
      }

      // 9. Hams
      if (
        m === 'Hamstrings' ||
        /romanian deadlift|rdl|stiff leg|leg curl|hamstring curl|nordic curl/i.test(t)
      ) {
        return 'hams';
      }

      // 10. Glutes
      if (
        m === 'Glutes' ||
        /hip thrust|glute bridge|glute kickback|kickback|hyperextension|cable kickback|abductor/i.test(t)
      ) {
        return 'glutes';
      }

      // Fallbacks
      if (/press|overhead|shoulder/i.test(t)) return 'triceps';
      if (/row|pull/i.test(t)) return 'back';
      if (/leg/i.test(t)) return 'quads';

      return 'core';
    };

    workouts.forEach(w => {
      w.exercises.forEach(ex => {
        const workingSets = ex.sets.filter(s => s.type !== 'warmup').length || ex.sets.length;
        const vol = unit === 'kg' ? ex.totalVolumeKg : ex.totalVolumeLbs;
        const targetKey = getRadarKey(ex.muscleGroup, ex.exerciseTitle);

        if (buckets[targetKey]) {
          buckets[targetKey].sets += workingSets;
          buckets[targetKey].volume += vol;
          buckets[targetKey].exercises.add(ex.exerciseTitle);
        }
      });
    });

    // Exact order requested: Chest, Back, Forearms, Biceps, Triceps, Core, Quads, Hams, Glutes, Calves
    return [
      { key: 'chest', ...buckets.chest, exerciseCount: buckets.chest.exercises.size, exercises: Array.from(buckets.chest.exercises) },
      { key: 'back', ...buckets.back, exerciseCount: buckets.back.exercises.size, exercises: Array.from(buckets.back.exercises) },
      { key: 'forearms', ...buckets.forearms, exerciseCount: buckets.forearms.exercises.size, exercises: Array.from(buckets.forearms.exercises) },
      { key: 'biceps', ...buckets.biceps, exerciseCount: buckets.biceps.exercises.size, exercises: Array.from(buckets.biceps.exercises) },
      { key: 'triceps', ...buckets.triceps, exerciseCount: buckets.triceps.exercises.size, exercises: Array.from(buckets.triceps.exercises) },
      { key: 'core', ...buckets.core, exerciseCount: buckets.core.exercises.size, exercises: Array.from(buckets.core.exercises) },
      { key: 'quads', ...buckets.quads, exerciseCount: buckets.quads.exercises.size, exercises: Array.from(buckets.quads.exercises) },
      { key: 'hams', ...buckets.hams, exerciseCount: buckets.hams.exercises.size, exercises: Array.from(buckets.hams.exercises) },
      { key: 'glutes', ...buckets.glutes, exerciseCount: buckets.glutes.exercises.size, exercises: Array.from(buckets.glutes.exercises) },
      { key: 'calves', ...buckets.calves, exerciseCount: buckets.calves.exercises.size, exercises: Array.from(buckets.calves.exercises) },
    ];
  }, [workouts, unit]);

  // Max value calculation for normalization
  const maxMetricValue = useMemo(() => {
    const values = radarData.map(d => (metricMode === 'sets' ? d.sets : d.volume));
    const max = Math.max(...values, 0);
    return max > 0 ? max : 1;
  }, [radarData, metricMode]);

  const totalMetricSum = useMemo(() => {
    return radarData.reduce((acc, d) => acc + (metricMode === 'sets' ? d.sets : d.volume), 0) || 1;
  }, [radarData, metricMode]);

  // Geometry calculations for 10-pointed star/radar: safely contained within viewBox 480x430
  const width = 480;
  const height = 430;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 108; // Max radius for data polygon
  const numAxes = radarData.length;
  const angleStep = (2 * Math.PI) / numAxes;

  // Concentric levels (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  // Helper to calculate coordinates
  const getCoordinates = (index: number, distance: number) => {
    // Start at -PI/2 (top, 12 o'clock for Chest)
    const angle = -Math.PI / 2 + index * angleStep;
    return {
      x: centerX + distance * Math.cos(angle),
      y: centerY + distance * Math.sin(angle),
    };
  };

  // Build SVG polygon points string for data
  const dataPoints = useMemo(() => {
    return radarData.map((d, i) => {
      const val = metricMode === 'sets' ? d.sets : d.volume;
      const ratio = Math.max(val / maxMetricValue, 0.05);
      const coord = getCoordinates(i, radius * ratio);
      return {
        ...coord,
        val,
        ratio,
        label: d.label,
        dim: d,
      };
    });
  }, [radarData, maxMetricValue, metricMode, radius]);

  const polygonPathString = useMemo(() => {
    return dataPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  }, [dataPoints]);

  // Balance index assessment (Standard deviation / coefficient of variation)
  const balanceInfo = useMemo(() => {
    const vals = radarData.map(d => (metricMode === 'sets' ? d.sets : d.volume));
    const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    if (mean === 0) return { label: 'No Data', color: 'text-[#94A3B8]', bg: 'bg-[#1E293B] border-[#334155]' };
    const variance = vals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / vals.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;

    if (cv < 0.45) return { label: 'Well Balanced Split', color: 'text-[#34D399]', bg: 'bg-[#064E3B]/40 border-[#059669]/40' };
    if (cv < 0.8) return { label: 'Targeted Focus Split', color: 'text-[#38BDF8]', bg: 'bg-[#0C4A6E]/40 border-[#0284C7]/40' };
    return { label: 'Specialized Training', color: 'text-[#F59E0B]', bg: 'bg-[#78350F]/40 border-[#D97706]/40' };
  }, [radarData, metricMode]);

  const activeDim = hoveredIndex !== null ? radarData[hoveredIndex] : null;

  return (
    <div className="bg-[#131D31] rounded-2xl p-3.5 sm:p-5 border border-[#1E293B] shadow-sm relative space-y-4">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Radar className="w-4 h-4 text-[#2ba2fb]" />
            <h3 className="text-sm sm:text-base font-bold text-[#F8FAFC]">
              Muscle Balance Radar (10 Target Zones)
            </h3>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${balanceInfo.bg} ${balanceInfo.color}`}>
              {balanceInfo.label}
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Radial 10-point spider chart across Chest, Back, Forearms, Biceps, Triceps, Core, Quads, Hams, Glutes, and Calves
          </p>
        </div>

        {/* Metric, View Mode, & Scroll Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">

          {/* Metric Toggle: Sets vs Volume */}
          <div className="flex items-center gap-1 bg-[#0B0F17] p-0.5 rounded-md border border-[#1E293B] text-xs font-semibold">
            <button
              onClick={() => setMetricMode('sets')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-sm transition-all duration-150 hover:-translate-y-0.5 active:scale-95 ${
                metricMode === 'sets'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Sets</span>
            </button>
            <button
              onClick={() => setMetricMode('volume')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-sm transition-all duration-150 hover:-translate-y-0.5 active:scale-95 ${
                metricMode === 'volume'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Weight className="w-3 h-3" />
              <span>Volume ({unit})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Radar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Left Column: Responsive SVG 10-pointed Spider Chart (shrinks to fit screen) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative w-full">
            <div className="w-full rounded-xl border border-[#1E293B]/70 bg-[#0B0F17]/40 p-2 sm:p-3 flex flex-col items-center justify-center">
              <div className="w-full max-w-[440px] mx-auto flex flex-col items-center">
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  className="w-full max-w-[440px] h-auto aspect-[440/395] select-none drop-shadow-md mx-auto transition-all"
                >
            <defs>
              {/* Radial gradient for data web polygon */}
              <radialGradient id="radarGlow10" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#2ba2fb" stopOpacity="0.5" />
                <stop offset="60%" stopColor="#2563EB" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.08" />
              </radialGradient>
              <filter id="vertexGlow10" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#2ba2fb" floodOpacity="0.8" />
              </filter>
            </defs>

            {/* 1. Concentric Polygon Web Rings */}
            {gridLevels.map((lvl, lIdx) => {
              const ringPoints = radarData
                .map((_, i) => {
                  const pt = getCoordinates(i, radius * lvl);
                  return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
                })
                .join(' ');

              return (
                <g key={`ring-${lIdx}`}>
                  <polygon
                    points={ringPoints}
                    fill={lIdx === gridLevels.length - 1 ? 'rgba(30, 41, 59, 0.22)' : 'none'}
                    stroke={theme === 'light' ? '#DAC6B2' : '#334155'}
                    strokeWidth="1"
                    strokeDasharray={lIdx < gridLevels.length - 1 ? '3 3' : 'none'}
                    opacity={theme === 'light' ? 0.75 : 0.65}
                  />
                  {/* Subtle level label at top vertex */}
                  <text
                    x={centerX}
                    y={centerY - radius * lvl + 9}
                    textAnchor="middle"
                    className="text-[9px] fill-[#64748B] font-mono pointer-events-none"
                  >
                    {Math.round(lvl * 100)}%
                  </text>
                </g>
              );
            })}

            {/* 2. Radial Spokes for all 10 axes */}
            {radarData.map((_, i) => {
              const edge = getCoordinates(i, radius);
              return (
                <line
                  key={`spoke-${i}`}
                  x1={centerX}
                  y1={centerY}
                  x2={edge.x}
                  y2={edge.y}
                  stroke={theme === 'light' ? '#DAC6B2' : '#334155'}
                  strokeWidth="1"
                  strokeOpacity="0.7"
                />
              );
            })}

            {/* 3. Filled Radar Data Polygon */}
            <polygon
              points={polygonPathString}
              fill="url(#radarGlow10)"
              stroke="#2ba2fb"
              strokeWidth="2.5"
              strokeLinejoin="round"
              className="transition-all duration-300 ease-out"
            />

            {/* 4. Axis Labels for 10 dimensions with touch & hover hit-areas */}
            {radarData.map((d, i) => {
              const labelDist = radius + 22;
              const angle = -Math.PI / 2 + i * angleStep;
              const lx = centerX + labelDist * Math.cos(angle);
              const ly = centerY + labelDist * Math.sin(angle);

              // Determine text-anchor based on cos(angle)
              const cos = Math.cos(angle);
              let anchor: 'middle' | 'start' | 'end' = 'middle';
              if (cos > 0.2) anchor = 'start';
              else if (cos < -0.2) anchor = 'end';

              const isHovered = hoveredIndex === i;

              return (
                <g
                  key={`label-${d.key}`}
                  className="cursor-pointer group select-none"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => {
                    setHoveredIndex(prev => (prev === i ? null : i));
                  }}
                >
                  <text
                    x={lx}
                    y={ly + 4}
                    textAnchor={anchor}
                    className={`text-[10px] sm:text-[11px] font-bold transition-all duration-150 ${
                      isHovered
                        ? 'fill-[#2ba2fb] font-extrabold'
                        : theme === 'light'
                        ? 'fill-[#2D2117]'
                        : 'fill-[#E2E8F0]'
                    }`}
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}

            {/* 5. Vertex Dots & Interactivity Rings */}
            {dataPoints.map((pt, i) => {
              const isHovered = hoveredIndex === i;
              return (
                <g
                  key={`vertex-${i}`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => {
                    setHoveredIndex(prev => (prev === i ? null : i));
                  }}
                >
                  {/* Generous touch/hover hit-area */}
                  <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />

                  {/* Pulsing ring on hover/selection */}
                  {isHovered && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="9"
                      fill="none"
                      stroke="#2ba2fb"
                      strokeWidth="2"
                      opacity="0.85"
                    />
                  )}

                  {/* Solid Vertex Marker */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5.5 : 4}
                    fill={isHovered ? '#FFFFFF' : '#2ba2fb'}
                    stroke="#1E3A8A"
                    strokeWidth="1.5"
                    filter={isHovered ? 'url(#vertexGlow10)' : undefined}
                    className="transition-all duration-150"
                  />
                </g>
              );
            })}
          </svg>

                {/* Quick Info Chip Under Radar */}
                <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8] mt-2 text-center">
                  <Sparkles className="w-3.5 h-3.5 text-[#2ba2fb] shrink-0" />
                  <span>Hover or tap vertices to inspect volume & set shares</span>
                </div>
              </div>
            </div>
          </div>

        {/* Right Column: Detailed Metric Breakdown & Ranked Muscle Bars */}
        <div className="lg:col-span-5 space-y-3.5">

          {/* Ranked Progress Bars (Fits full natural height) */}
          <div className="space-y-1.5 w-full">
            {radarData
              .slice()
              .sort((a, b) => (metricMode === 'sets' ? b.sets - a.sets : b.volume - a.volume))
              .map((dim) => {
                const val = metricMode === 'sets' ? dim.sets : dim.volume;
                const pct = Math.round((val / totalMetricSum) * 100);
                const isHovered = activeDim?.key === dim.key;

                return (
                  <div
                    key={dim.key}
                    onMouseEnter={() => setHoveredIndex(radarData.findIndex(r => r.key === dim.key))}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      isHovered
                        ? 'bg-[#1E293B]/80 border-[#2ba2fb] shadow-sm'
                        : 'bg-[#0B0F17]/60 border-[#1E293B] hover:border-[#334155]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-[#E2E8F0]">{dim.label}</span>
                      <span className="font-mono text-[11px] text-[#2ba2fb] font-bold">
                        {val.toLocaleString()} {metricMode === 'sets' ? 'sets' : unit}{' '}
                        <span className="text-[#94A3B8] font-normal">({pct}%)</span>
                      </span>
                    </div>
                    {/* Bar */}
                    <div className="w-full bg-[#1E293B] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#2563EB] to-[#2ba2fb] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(pct * 2.5, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
