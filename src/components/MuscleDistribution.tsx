import React, { useMemo } from 'react';
import { Workout, UnitPreference, MuscleGroup } from '../types/workout';
import { MUSCLE_COLORS } from '../utils/muscleTaxonomy';
import { PieChart, ShieldCheck } from 'lucide-react';

interface MuscleDistributionProps {
  workouts: Workout[];
  unit: UnitPreference;
  onSelectExercise?: (exerciseTitle: string) => void;
}

export const MuscleDistribution: React.FC<MuscleDistributionProps> = ({
  workouts,
  unit,
  onSelectExercise,
}) => {
  const analytics = useMemo(() => {
    const muscleSets: Record<string, number> = {};
    const muscleVolume: Record<string, number> = {};
    const muscleExercises: Record<string, Set<string>> = {};

    let totalWorkingSets = 0;
    let pushSets = 0;
    let pullSets = 0;
    let legsSets = 0;

    for (const w of workouts) {
      for (const ex of w.exercises) {
        const m = ex.muscleGroup;
        if (!muscleSets[m]) {
          muscleSets[m] = 0;
          muscleVolume[m] = 0;
          muscleExercises[m] = new Set();
        }

        const workingSets = ex.sets.filter(s => s.type !== 'warmup');
        muscleSets[m] += workingSets.length;
        muscleVolume[m] += unit === 'kg' ? ex.totalVolumeKg : ex.totalVolumeLbs;
        muscleExercises[m].add(ex.exerciseTitle);
        totalWorkingSets += workingSets.length;

        if (m === 'Chest' || m === 'Shoulders' || m === 'Triceps') {
          pushSets += workingSets.length;
        } else if (m === 'Back' || m === 'Biceps') {
          pullSets += workingSets.length;
        } else if (m === 'Quads' || m === 'Hamstrings' || m === 'Glutes' || m === 'Calves') {
          legsSets += workingSets.length;
        }
      }
    }

    const sortedMuscles = Object.entries(muscleSets)
      .map(([muscle, sets]) => ({
        muscle: muscle as MuscleGroup,
        sets,
        volume: muscleVolume[muscle] || 0,
        percentage: totalWorkingSets > 0 ? Math.round((sets / totalWorkingSets) * 100) : 0,
        exerciseCount: muscleExercises[muscle]?.size || 0,
        exercises: Array.from(muscleExercises[muscle] || []),
      }))
      .sort((a, b) => b.sets - a.sets);

    const pplTotal = (pushSets + pullSets + legsSets) || 1;
    const pushPct = Math.round((pushSets / pplTotal) * 100);
    const pullPct = Math.round((pullSets / pplTotal) * 100);
    const legsPct = Math.round((legsSets / pplTotal) * 100);

    return {
      sortedMuscles,
      totalWorkingSets,
      pushSets,
      pullSets,
      legsSets,
      pushPct,
      pullPct,
      legsPct,
    };
  }, [workouts, unit]);

  return (
    <div className="space-y-5">
      {/* Push / Pull / Legs Ratio Strip */}
      <div className="bg-surface rounded-xl p-5 border border-line shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-chalk flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-plate" />
              Push / Pull / Legs Balance Ratio
            </h2>
            <div className="text-xs text-dust mt-0.5">
              Distribution of working sets across primary kinetic movement planes
            </div>
          </div>
          <div className="text-xs text-plate font-semibold bg-tint-plate/60 px-3 py-1 rounded-lg border border-plate/30">
            {analytics.pushPct >= 25 && analytics.pullPct >= 25 && analytics.legsPct >= 25
              ? 'Well-Balanced Training Split'
              : 'Specialization Focus'}
          </div>
        </div>

        {/* Stacked Progress Bar with modern dark blue tones */}
        <div className="h-4 rounded-full overflow-hidden flex bg-void p-0.5 border border-line gap-0.5">
          <div
            style={{ width: `${analytics.pushPct}%` }}
            className="h-full bg-plate rounded-l-full transition-colors"
            title={`Push: ${analytics.pushPct}% (${analytics.pushSets} sets)`}
          />
          <div
            style={{ width: `${analytics.pullPct}%` }}
            className="h-full bg-grn transition-colors"
            title={`Pull: ${analytics.pullPct}% (${analytics.pullSets} sets)`}
          />
          <div
            style={{ width: `${analytics.legsPct}%` }}
            className="h-full bg-steel rounded-r-full transition-colors"
            title={`Legs: ${analytics.legsPct}% (${analytics.legsSets} sets)`}
          />
        </div>

        {/* 3 Zone Labels */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4 mt-3 text-center">
          <div className="bg-void p-2 sm:p-2.5 rounded-lg border border-line">
            <div className="text-[11px] sm:text-xs font-semibold text-steel flex items-center justify-center gap-1 sm:gap-1.5">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-plate shrink-0" />
              <span>Push: {analytics.pushPct}%</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-dust mt-0.5 font-mono tabular-nums">
              {analytics.pushSets} sets <span className="hidden sm:inline">(Chest, OHP, Tri)</span>
            </div>
          </div>

          <div className="bg-void p-2 sm:p-2.5 rounded-lg border border-line">
            <div className="text-[11px] sm:text-xs font-semibold text-grn flex items-center justify-center gap-1 sm:gap-1.5">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-grn shrink-0" />
              <span>Pull: {analytics.pullPct}%</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-dust mt-0.5 font-mono tabular-nums">
              {analytics.pullSets} sets <span className="hidden sm:inline">(Back, Rows, Bi)</span>
            </div>
          </div>

          <div className="bg-void p-2 sm:p-2.5 rounded-lg border border-line">
            <div className="text-[11px] sm:text-xs font-semibold text-steel flex items-center justify-center gap-1 sm:gap-1.5">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-steel shrink-0" />
              <span>Legs: {analytics.legsPct}%</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-dust mt-0.5 font-mono tabular-nums">
              {analytics.legsSets} sets <span className="hidden sm:inline">(Quads, Hams, Calves)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Muscle By Muscle Detailed Bars */}
      <div className="bg-surface rounded-xl p-3.5 sm:p-5 border border-line shadow-sm">
        <h3 className="text-sm font-semibold text-chalk mb-1 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-plate" />
          Target Muscle Group Distribution
        </h3>
        <p className="text-xs text-dust mb-5">
          Based on {analytics.totalWorkingSets} total working sets logged in this dataset
        </p>

        <div className="space-y-4">
          {analytics.sortedMuscles.map(item => {
            const style = MUSCLE_COLORS[item.muscle] || MUSCLE_COLORS['Full Body'];

            return (
              <div key={item.muscle} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${style.text}`}>
                      {item.muscle}
                    </span>
                    <span className="text-ash text-[11px]">
                      ({item.exerciseCount} exercise{item.exerciseCount > 1 ? 's' : ''})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-chalk tabular-nums font-mono text-xs">
                      {item.sets} sets
                    </span>
                    <span className="text-[11px] text-dust tabular-nums font-mono w-10 text-right">
                      {item.percentage}%
                    </span>
                    <span className="text-[11px] text-dust tabular-nums font-mono hidden sm:inline w-24 text-right">
                      {Math.round(item.volume).toLocaleString()} {unit}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 rounded-full bg-void overflow-hidden border border-line">
                  <div
                    style={{ width: `${item.percentage}%` }}
                    className={`h-full ${style.bar} rounded-full transition-colors`}
                  />
                </div>

                {/* Exercise list tags (clickable to drill down) */}
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {item.exercises.slice(0, 4).map(exName => (
                    <button
                      key={exName}
                      onClick={() => onSelectExercise && onSelectExercise(exName)}
                      className="text-[10px] font-semibold text-dust bg-void hover:bg-raised hover:text-chalk px-2 py-0.5 rounded-[4px] border border-line transition-colors duration-150"
                    >
                      {exName}
                    </button>
                  ))}
                  {item.exercises.length > 4 && (
                    <span className="text-[10px] text-ash self-center">
                      +{item.exercises.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
