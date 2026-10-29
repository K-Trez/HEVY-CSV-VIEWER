import React from 'react';
import { UnitPreference, DatasetInfo } from '../types/workout';
import { BrandMark } from './BrandMark';
import { UploadCloud, FileText, Trash2, Sun, Moon } from 'lucide-react';

type View = 'overview' | 'workouts' | 'routines' | 'exercises' | 'muscles';

interface HeaderProps {
  unit: UnitPreference;
  onToggleUnit: (unit: UnitPreference) => void;
  activeDataset: DatasetInfo | null;
  onOpenUpload: () => void;
  onClearData: () => void;
  activeView: View;
  onChangeView: (view: View) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const VIEWS: { id: View; label: string; short: string }[] = [
  { id: 'overview', label: 'Overview', short: 'Overview' },
  { id: 'workouts', label: 'Workout log', short: 'Workouts' },
  { id: 'routines', label: 'Routines', short: 'Routines' },
  { id: 'exercises', label: 'Exercises & PRs', short: 'Exercises' },
  { id: 'muscles', label: 'Muscle balance', short: 'Muscles' },
];

const ACTIVE_VIEW = 'bg-surface text-chalk border-line shadow-sm';
const IDLE_VIEW = 'text-dust hover:text-chalk hover:bg-raised border-transparent';

export const Header: React.FC<HeaderProps> = ({
  unit,
  onToggleUnit,
  activeDataset,
  onOpenUpload,
  onClearData,
  activeView,
  onChangeView,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-void/85 backdrop-blur-md border-b border-line px-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6 py-2.5">
        <div className="flex items-center gap-2.5 shrink-0">
          <BrandMark className="w-7 h-7 sm:w-8 sm:h-8" />
          <div className="flex flex-col">
            <span className="type-display text-sm sm:text-[15px] text-chalk whitespace-nowrap">
              Hevy Ledger
            </span>
            <span className="hidden sm:block text-[11px] leading-tight text-ash">
              Workout analytics
            </span>
          </div>
        </div>

        {activeDataset && (
          <nav
            aria-label="Views"
            className="hidden xl:flex items-center gap-1 bg-sunken p-1 rounded-lg border border-line"
          >
            {VIEWS.map(v => (
              <button
                key={v.id}
                onClick={() => onChangeView(v.id)}
                aria-current={activeView === v.id ? 'page' : undefined}
                className={`px-3 py-1.5 text-[12.5px] font-medium rounded-md border whitespace-nowrap shrink-0 ${
                  activeView === v.id ? ACTIVE_VIEW : IDLE_VIEW
                }`}
              >
                {v.label}
              </button>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onToggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-dust hover:text-chalk hover:bg-raised border border-transparent hover:border-line"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <div
            className="flex items-center bg-sunken p-0.5 rounded-lg border border-line text-xs font-medium"
            role="group"
            aria-label="Weight unit"
          >
            <button
              onClick={() => onToggleUnit('kg')}
              aria-pressed={unit === 'kg'}
              className={`px-2.5 py-1 rounded-md ${
                unit === 'kg' ? 'bg-plate text-on-plate' : 'text-dust hover:text-chalk'
              }`}
              title="Display weights in kilograms"
            >
              kg
            </button>
            <button
              onClick={() => onToggleUnit('lbs')}
              aria-pressed={unit === 'lbs'}
              className={`px-2.5 py-1 rounded-md ${
                unit === 'lbs' ? 'bg-plate text-on-plate' : 'text-dust hover:text-chalk'
              }`}
              title="Display weights in pounds"
            >
              lbs
            </button>
          </div>

          {activeDataset && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-sunken text-dust rounded-md border border-line max-w-[180px]">
              <FileText className="w-3.5 h-3.5 text-ash shrink-0" />
              <span className="truncate">{activeDataset.filename}</span>
            </div>
          )}

          {activeDataset && (
            <button
              onClick={onClearData}
              className="flex items-center justify-center w-8 h-8 text-dust hover:text-danger hover:bg-tint-ply rounded-lg border border-transparent hover:border-danger/30"
              title="Clear loaded CSV"
              aria-label="Clear loaded CSV"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs sm:text-[13px] font-medium text-white bg-ply hover:bg-ply-deep rounded-lg shadow-sm whitespace-nowrap shrink-0"
          >
            <UploadCloud className="w-4 h-4" />
            <span className="hidden sm:inline">{activeDataset ? 'Upload CSV' : 'Upload Hevy CSV'}</span>
            <span className="sm:hidden">Upload</span>
          </button>
        </div>
      </div>

      {activeDataset && (
        <div className="xl:hidden grid grid-cols-5 gap-1 bg-sunken border border-line p-1 rounded-lg mb-2 select-none">
          {VIEWS.map(v => (
            <button
              key={v.id}
              onClick={() => onChangeView(v.id)}
              aria-current={activeView === v.id ? 'page' : undefined}
              className={`py-1.5 px-0.5 text-[11.5px] font-medium rounded-md text-center border transition-colors duration-150 truncate ${
                activeView === v.id ? ACTIVE_VIEW : IDLE_VIEW
              }`}
            >
              {v.short}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
