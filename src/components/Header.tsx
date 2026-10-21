import React from 'react';
import { UnitPreference, DatasetInfo } from '../types/workout';
import { Dumbbell, UploadCloud, FileText, Trash2, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  unit: UnitPreference;
  onToggleUnit: (unit: UnitPreference) => void;
  activeDataset: DatasetInfo | null;
  onOpenUpload: () => void;
  onClearData: () => void;
  activeView: 'overview' | 'workouts' | 'exercises' | 'muscles';
  onChangeView: (view: 'overview' | 'workouts' | 'exercises' | 'muscles') => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

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
    <header className="sticky top-0 z-30 bg-[#0B0F17]/90 backdrop-blur-md border-b border-[#1E293B] px-3 sm:px-8 py-2.5 sm:py-3 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5 sm:gap-4 md:gap-8">
        {/* Zone 1: Brand Title */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-[#2563EB] text-white flex items-center justify-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95">
            <Dumbbell className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.3]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-bold tracking-tight text-[#F8FAFC] whitespace-nowrap">
              Hevy Vault
            </span>
            <span className="text-[10px] font-medium text-[#64748B] -mt-0.5 hidden sm:inline">
              Workout CSV Explorer
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links / Views (more square-y and animated) */}
        {activeDataset && (
          <nav className="hidden md:flex items-center gap-1 bg-[#111A2E] p-1 rounded-md border border-[#1E293B] transition-all">
            <button
              onClick={() => onChangeView('overview')}
              className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-all duration-150 whitespace-nowrap shrink-0 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] ${
                activeView === 'overview'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/60'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onChangeView('workouts')}
              className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-all duration-150 whitespace-nowrap shrink-0 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] ${
                activeView === 'workouts'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/60'
              }`}
            >
              Workouts Log
            </button>
            <button
              onClick={() => onChangeView('exercises')}
              className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-all duration-150 whitespace-nowrap shrink-0 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] ${
                activeView === 'exercises'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/60'
              }`}
            >
              Exercises & PRs
            </button>
            <button
              onClick={() => onChangeView('muscles')}
              className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-all duration-150 whitespace-nowrap shrink-0 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] ${
                activeView === 'muscles'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/60'
              }`}
            >
              Muscle Balance
            </button>
          </nav>
        )}

        {/* Zone 3: Primary Action & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Theme Toggle Button: Pastel Orange & Tan Light Mode vs Dark Blue */}
          <button
            onClick={onToggleTheme}
            className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-[#111A2E] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#1E293B] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-sm"
            title={theme === 'dark' ? 'Switch to Pastel Orange & Tan (Light Mode)' : 'Switch to Dark Blue Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FB923C] hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#EA580C] hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* Unit Toggle Switch: Square-y buttons */}
          <div className="flex items-center bg-[#111A2E] p-0.5 rounded-md border border-[#1E293B] text-[11px] sm:text-xs font-semibold">
            <button
              onClick={() => onToggleUnit('kg')}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-sm transition-all duration-150 hover:-translate-y-0.5 active:scale-95 ${
                unit === 'kg'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
              title="Display weights in kilograms"
            >
              kg
            </button>
            <button
              onClick={() => onToggleUnit('lbs')}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-sm transition-all duration-150 hover:-translate-y-0.5 active:scale-95 ${
                unit === 'lbs'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
              title="Display weights in pounds"
            >
              lbs
            </button>
          </div>

          {/* Active File Name Badge (if loaded) */}
          {activeDataset && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[#131D31] text-[#E2E8F0] rounded-md border border-[#1E293B] max-w-[170px]">
              <FileText className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
              <span className="truncate">{activeDataset.filename}</span>
            </div>
          )}

          {/* Clear CSV Button (if loaded) */}
          {activeDataset && (
            <button
              onClick={onClearData}
              className="p-1 sm:p-1.5 text-xs font-medium text-[#94A3B8] hover:text-[#F87171] hover:bg-[#1E293B] rounded-md border border-[#1E293B] transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
              title="Clear loaded CSV"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {/* Upload Button: Square-y with micro-interaction */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 rounded-md shadow-sm whitespace-nowrap shrink-0"
          >
            <UploadCloud className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{activeDataset ? 'Upload CSV' : 'Upload Hevy CSV'}</span>
            <span className="sm:hidden">Upload</span>
          </button>
        </div>
      </div>

      {/* Mobile view navigation tab bar: Square-y buttons with horizontal touch scrolling */}
      {activeDataset && (
        <div className="md:hidden flex items-center gap-1.5 mt-2 pt-2 border-t border-[#1E293B] overflow-x-auto pb-0.5 select-none no-scrollbar">
          <button
            onClick={() => onChangeView('overview')}
            className={`px-3 py-1 text-xs font-bold rounded-sm whitespace-nowrap shrink-0 transition-all duration-150 hover:-translate-y-0.5 active:scale-95 ${
              activeView === 'overview' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onChangeView('workouts')}
            className={`px-3 py-1 text-xs font-bold rounded-sm whitespace-nowrap shrink-0 transition-all duration-150 hover:-translate-y-0.5 active:scale-95 ${
              activeView === 'workouts' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            Workouts ({activeDataset.workoutCount})
          </button>
          <button
            onClick={() => onChangeView('exercises')}
            className={`px-3 py-1 text-xs font-bold rounded-sm whitespace-nowrap shrink-0 transition-all duration-150 hover:-translate-y-0.5 active:scale-95 ${
              activeView === 'exercises' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            Exercises & PRs
          </button>
          <button
            onClick={() => onChangeView('muscles')}
            className={`px-3 py-1 text-xs font-bold rounded-sm whitespace-nowrap shrink-0 transition-all duration-150 hover:-translate-y-0.5 active:scale-95 ${
              activeView === 'muscles' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            Muscle Splits
          </button>
        </div>
      )}
    </header>
  );
};
