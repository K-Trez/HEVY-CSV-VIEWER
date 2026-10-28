import React from 'react';
import { UnitPreference } from '../types/workout';
import { Activity, Clock, Flame, Trophy, Dumbbell } from 'lucide-react';

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

type Accent = 'plate' | 'steel' | 'grn' | 'gold' | 'neutral';

interface CardProps {
  label: string;
  icon: React.ReactNode;
  accent: Accent;
  value: React.ReactNode;
  unit?: string;
  footnote: React.ReactNode;
  wide?: boolean;
}

const ICON: Record<Accent, string> = {
  plate: 'bg-tint-plate text-plate',
  steel: 'bg-tint-steel text-steel',
  grn: 'bg-tint-grn text-grn',
  gold: 'bg-tint-gold text-gold',
  neutral: 'bg-raised text-ash',
};

const UNIT: Record<Accent, string> = {
  plate: 'text-plate',
  steel: 'text-steel',
  grn: 'text-grn',
  gold: 'text-gold',
  neutral: 'text-ash',
};

const Card: React.FC<CardProps> = ({ label, icon, accent, value, unit, footnote, wide }) => (
  <article
    className={`rounded-xl border border-line bg-surface p-3.5 md:p-3 lg:p-5 transition-colors hover:border-line-strong ${
      wide ? 'col-span-2 md:col-span-1' : ''
    }`}
  >
    <div className="flex items-start justify-between gap-1.5 md:gap-1.5 lg:gap-2">
      <h3 className="text-[11px] lg:text-xs font-medium text-dust leading-5">{label}</h3>
      <span className={`w-5 h-5 lg:w-7 lg:h-7 rounded-md lg:rounded-lg flex items-center justify-center shrink-0 ${ICON[accent]}`}>
        {icon}
      </span>
    </div>

    <div className="mt-3 type-data text-[20px] lg:text-[28px] font-semibold text-chalk leading-none">
      {value}
      {unit && (
        <span className={`type-stamp text-[9px] lg:text-[10px] ml-1.5 align-baseline ${UNIT[accent]}`}>{unit}</span>
      )}
    </div>

    <p className="mt-2.5 text-[10.5px] lg:text-[11.5px] leading-tight text-ash tabular-nums">{footnote}</p>
  </article>
);

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
  const formattedVolume = Math.round(volumeValue).toLocaleString();
  const avgSessionVolume =
    totalWorkouts > 0 ? Math.round(volumeValue / totalWorkouts).toLocaleString() : '0';

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <Card
        wide
        label="Lifetime volume"
        icon={<Dumbbell className="w-4 h-4" />}
        accent="plate"
        value={formattedVolume}
        unit={unit}
        footnote={`${avgSessionVolume} ${unit} per session`}
      />

      <Card
        label="Sessions logged"
        icon={<Activity className="w-4 h-4" />}
        accent="steel"
        value={totalWorkouts}
        unit="total"
        footnote={dateRangeStr || 'Training history'}
      />

      <Card
        label="Sets & reps"
        icon={<Flame className="w-4 h-4" />}
        accent="grn"
        value={totalSets.toLocaleString()}
        unit="sets"
        footnote={`${totalReps.toLocaleString()} reps · ${totalSets > 0 ? Math.round(totalReps / totalSets) : 0} per set`}
      />

      <Card
        label="Gym time"
        icon={<Clock className="w-4 h-4" />}
        accent="neutral"
        value={totalHours}
        unit="hrs"
        footnote={`${totalWorkouts > 0 ? Math.round((totalHours * 60) / totalWorkouts) : 0} min average session`}
      />

      <Card
        label="Milestone PRs"
        icon={<Trophy className="w-4 h-4" />}
        accent="gold"
        value={totalPRs}
        unit="records"
        footnote="Set across all lifts"
      />
    </div>
  );
};
