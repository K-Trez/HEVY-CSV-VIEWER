import React from 'react';
import { Workout, UnitPreference } from '../types/workout';
import { MUSCLE_COLORS } from '../utils/muscleTaxonomy';
import { X, Calendar, Clock, Trophy, FileText, ArrowRight } from 'lucide-react';

interface WorkoutDetailModalProps {
  workout: Workout | null;
  unit: UnitPreference;
  onClose: () => void;
  onDrillDownExercise: (exerciseTitle: string) => void;
}

export const WorkoutDetailModal: React.FC<WorkoutDetailModalProps> = ({
  workout,
  unit,
  onClose,
  onDrillDownExercise,
}) => {
  if (!workout) return null;

  const volume = unit === 'kg' ? workout.totalVolumeKg : workout.totalVolumeLbs;
  const prCount = workout.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter(s => s.isPR).length,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-void/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-surface rounded-xl sm:rounded-xl max-w-3xl w-full border border-line shadow-2xl overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="p-3.5 sm:p-6 border-b border-line flex items-start justify-between gap-3 bg-void/50">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-semibold text-chalk">
                {workout.title}
              </h2>
              {prCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-plate bg-tint-plate/60 px-2 py-0.5 rounded-[4px] border border-plate/30">
                  <Trophy className="w-3.5 h-3.5 fill-plate" />
                  {prCount} Milestone PR{prCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-dust mt-1.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-ash" />
                {workout.startTime.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span aria-hidden="true" className="text-ash">·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-ash" />
                {workout.durationMinutes} min
              </span>
              <span aria-hidden="true" className="text-ash">·</span>
              <span>
                {workout.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                {workout.endTime && ` – ${workout.endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-void text-dust hover:bg-raised hover:text-chalk flex items-center justify-center border border-line transition-colors duration-150 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workout Quick Summary Bar */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 bg-void border-b border-line text-center">
          <div>
            <div className="text-[9px] sm:text-[10px] font-semibold text-ash uppercase tracking-wider">Session Volume</div>
            <div className="text-xs sm:text-base font-semibold text-chalk tabular-nums font-mono">
              {volume.toLocaleString()} <span className="text-[10px] sm:text-xs font-normal text-dust">{unit}</span>
            </div>
          </div>
          <div className="border-x border-line">
            <div className="text-[9px] sm:text-[10px] font-semibold text-ash uppercase tracking-wider">Total Sets</div>
            <div className="text-xs sm:text-base font-semibold text-chalk tabular-nums font-mono">
              {workout.totalSets}
            </div>
          </div>
          <div>
            <div className="text-[9px] sm:text-[10px] font-semibold text-ash uppercase tracking-wider">Total Reps</div>
            <div className="text-xs sm:text-base font-semibold text-chalk tabular-nums font-mono">
              {workout.totalReps}
            </div>
          </div>
        </div>

        {/* Description / Notes */}
        {workout.description && (
          <div className="mx-3.5 sm:mx-6 mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-lg bg-void border border-line text-xs text-dust flex items-start gap-2">
            <FileText className="w-4 h-4 text-ash shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-chalk">Session Notes:</div>
              <div className="italic mt-0.5">"{workout.description}"</div>
            </div>
          </div>
        )}

        {/* Scrollable Exercises and Sets Breakdown */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4 flex-1">
          {workout.exercises.map((ex, exIdx) => {
            const muscleStyle = MUSCLE_COLORS[ex.muscleGroup] || MUSCLE_COLORS['Full Body'];

            return (
              <div key={exIdx} className="bg-void rounded-xl p-4 border border-line">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-chalk">
                      {ex.exerciseTitle}
                    </span>
                    <span className={`text-[11px] font-semibold ${muscleStyle.text}`}>
                      {ex.muscleGroup}
                    </span>
                    {ex.supersetId && (
                      <span className="text-[10px] font-semibold text-steel bg-tint-steel/30 px-1.5 py-0.5 rounded-lg border border-steel/40">
                        Superset #{ex.supersetId}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      onDrillDownExercise(ex.exerciseTitle);
                      onClose();
                    }}
                    className="text-xs font-semibold text-plate hover:underline flex items-center gap-1 transition-colors"
                  >
                    <span>View Progress</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {ex.notes && (
                  <div className="text-xs text-ash italic mb-3">
                    Note: {ex.notes}
                  </div>
                )}

                {/* Detailed Set Table with smooth mobile touch horizontal scroll */}
                <div className="overflow-x-auto touch-pan-x bg-surface rounded-lg border border-line">
                  <table className="w-full min-w-[420px] text-xs text-left">
                    <thead className="bg-void text-[10px] font-semibold text-ash uppercase tracking-wider border-b border-line">
                      <tr>
                        <th className="py-2 px-3">Set</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3 text-right">Weight</th>
                        <th className="py-2 px-3 text-right">Reps</th>
                        <th className="py-2 px-3 text-right">Est. 1RM</th>
                        <th className="py-2 px-3 text-right">Volume</th>
                        <th className="py-2 px-3 text-right">RPE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {ex.sets.map((set, sIdx) => {
                        const weight = unit === 'kg' ? set.weightKg : set.weightLbs;
                        const oneRM = unit === 'kg' ? set.estimated1RMKg : set.estimated1RMLbs;
                        const vol = unit === 'kg' ? set.volumeKg : set.volumeLbs;

                        return (
                          <tr
                            key={sIdx}
                            className={`hover:bg-raised/40 transition-colors ${
                              set.isPR ? 'bg-tint-gold/50 font-semibold' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 tabular-nums font-mono text-chalk">
                              <span className="flex items-center gap-1">
                                {set.index}
                                {set.isPR && (
                                  <Trophy className="w-3 h-3 text-plate fill-plate" />
                                )}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 capitalize text-dust">
                              {set.type}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-mono font-semibold text-chalk">
                              {weight > 0 ? `${weight} ${unit}` : 'BW'}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-mono text-chalk">
                              {set.reps}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-mono text-dust">
                              {oneRM > 0 ? `${oneRM} ${unit}` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-mono text-dust">
                              {vol > 0 ? `${vol.toLocaleString()} ${unit}` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-mono text-ash">
                              {set.rpe ? `@${set.rpe}` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-void border-t border-line flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-chalk bg-raised border border-line-strong hover:bg-ply rounded-lg transition-colors duration-150 shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
