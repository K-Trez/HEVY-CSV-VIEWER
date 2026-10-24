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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#0B0F17]/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#131D31] rounded-2xl sm:rounded-3xl max-w-3xl w-full border border-[#1E293B] shadow-2xl overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="p-3.5 sm:p-6 border-b border-[#1E293B] flex items-start justify-between gap-3 bg-[#0B0F17]/50">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-extrabold text-[#F8FAFC]">
                {workout.title}
              </h2>
              {prCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#38BDF8] bg-[#0C4A6E]/40 px-2 py-0.5 rounded-lg border border-[#0284C7]/40">
                  <Trophy className="w-3.5 h-3.5 fill-[#38BDF8]" />
                  {prCount} Milestone PR{prCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-[#94A3B8] mt-1.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
                {workout.startTime.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span aria-hidden="true" className="text-[#475569]">·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                {workout.durationMinutes} min
              </span>
              <span aria-hidden="true" className="text-[#475569]">·</span>
              <span>
                {workout.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                {workout.endTime && ` – ${workout.endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-[#0B0F17] text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC] flex items-center justify-center border border-[#1E293B] transition-all duration-150 hover:-translate-y-0.5 active:scale-95 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workout Quick Summary Bar */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 bg-[#0B0F17] border-b border-[#1E293B] text-center">
          <div>
            <div className="text-[9px] sm:text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Session Volume</div>
            <div className="text-xs sm:text-base font-extrabold text-[#F8FAFC] tabular-nums font-mono">
              {volume.toLocaleString()} <span className="text-[10px] sm:text-xs font-normal text-[#94A3B8]">{unit}</span>
            </div>
          </div>
          <div className="border-x border-[#1E293B]">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Total Sets</div>
            <div className="text-xs sm:text-base font-extrabold text-[#F8FAFC] tabular-nums font-mono">
              {workout.totalSets}
            </div>
          </div>
          <div>
            <div className="text-[9px] sm:text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Total Reps</div>
            <div className="text-xs sm:text-base font-extrabold text-[#F8FAFC] tabular-nums font-mono">
              {workout.totalReps}
            </div>
          </div>
        </div>

        {/* Description / Notes */}
        {workout.description && (
          <div className="mx-3.5 sm:mx-6 mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-xl bg-[#0B0F17] border border-[#1E293B] text-xs text-[#94A3B8] flex items-start gap-2">
            <FileText className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[#F8FAFC]">Session Notes:</div>
              <div className="italic mt-0.5">"{workout.description}"</div>
            </div>
          </div>
        )}

        {/* Scrollable Exercises and Sets Breakdown */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4 flex-1">
          {workout.exercises.map((ex, exIdx) => {
            const muscleStyle = MUSCLE_COLORS[ex.muscleGroup] || MUSCLE_COLORS['Full Body'];

            return (
              <div key={exIdx} className="bg-[#0B0F17] rounded-2xl p-4 border border-[#1E293B]">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[#F8FAFC]">
                      {ex.exerciseTitle}
                    </span>
                    <span className={`text-[11px] font-semibold ${muscleStyle.text}`}>
                      {ex.muscleGroup}
                    </span>
                    {ex.supersetId && (
                      <span className="text-[10px] font-bold text-[#A5B4FC] bg-[#312E81]/30 px-1.5 py-0.5 rounded-md border border-[#4F46E5]/40">
                        Superset #{ex.supersetId}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      onDrillDownExercise(ex.exerciseTitle);
                      onClose();
                    }}
                    className="text-xs font-semibold text-[#38BDF8] hover:underline flex items-center gap-1 transition-colors"
                  >
                    <span>View Progress</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {ex.notes && (
                  <div className="text-xs text-[#64748B] italic mb-3">
                    Note: {ex.notes}
                  </div>
                )}

                {/* Detailed Set Table with smooth mobile touch horizontal scroll */}
                <div className="overflow-x-auto touch-pan-x bg-[#131D31] rounded-xl border border-[#1E293B]">
                  <table className="w-full min-w-[420px] text-xs text-left">
                    <thead className="bg-[#0B0F17] text-[10px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#1E293B]">
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
                    <tbody className="divide-y divide-[#1E293B]">
                      {ex.sets.map((set, sIdx) => {
                        const weight = unit === 'kg' ? set.weightKg : set.weightLbs;
                        const oneRM = unit === 'kg' ? set.estimated1RMKg : set.estimated1RMLbs;
                        const vol = unit === 'kg' ? set.volumeKg : set.volumeLbs;

                        return (
                          <tr
                            key={sIdx}
                            className={`hover:bg-[#1E293B]/40 transition-colors ${
                              set.isPR ? 'bg-[#1E3A8A]/30 font-semibold' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 tabular-nums font-mono text-[#F8FAFC]">
                              <span className="flex items-center gap-1">
                                {set.index}
                                {set.isPR && (
                                  <Trophy className="w-3 h-3 text-[#38BDF8] fill-[#38BDF8]" />
                                )}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 capitalize text-[#94A3B8]">
                              {set.type}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-mono font-bold text-[#F8FAFC]">
                              {weight > 0 ? `${weight} ${unit}` : 'BW'}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-mono text-[#F8FAFC]">
                              {set.reps}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-mono text-[#94A3B8]">
                              {oneRM > 0 ? `${oneRM} ${unit}` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-mono text-[#94A3B8]">
                              {vol > 0 ? `${vol.toLocaleString()} ${unit}` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-mono text-[#64748B]">
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
        <div className="p-4 bg-[#0B0F17] border-t border-[#1E293B] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#F8FAFC] bg-[#1E293B] border border-[#334155] hover:bg-[#2563EB] rounded-md transition-all duration-150 hover:-translate-y-0.5 active:scale-95 shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
