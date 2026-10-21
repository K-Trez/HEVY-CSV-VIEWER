import React from 'react';
import { UnitPreference, DatasetInfo } from '../types/workout';
import { Dumbbell, UploadCloud, FileText, Trash2 } from 'lucide-react';

interface HeaderProps {
  unit: UnitPreference;
  onToggleUnit: (unit: UnitPreference) => void;
  activeDataset: DatasetInfo | null;
  onOpenUpload: () => void;
  onClearData: () => void;
  activeView: 'overview' | 'workouts' | 'exercises' | 'muscles';
  onChangeView: (view: 'overview' | 'workouts' | 'exercises' | 'muscles') => void;
}

export const Header: React.FC<HeaderProps> = ({
  unit,
  onToggleUnit,
  activeDataset,
  onOpenUpload,
  onClearData,
  activeView,
  onChangeView,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0B0F17]/90 backdrop-blur-md border-b border-[#1E293B] px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-transform active:scale-95">
            <Dumbbell className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-[#F8FAFC] whitespace-nowrap">
              Hevy Vault
            </span>
            <span className="text-[11px] font-medium text-[#64748B] -mt-0.5 hidden sm:inline">
              Workout CSV Explorer
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links / Views (only active if data is loaded) */}
        {activeDataset && (
          <nav className="hidden md:flex items-center gap-1 bg-[#111A2E] p-1 rounded-xl border border-[#1E293B]">
            <button
              onClick={() => onChangeView('overview')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeView === 'overview'
                  ? 'bg-[#2563EB] text-white shadow-[0_0_12px_rgba(37,99,235,0.35)]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onChangeView('workouts')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeView === 'workouts'
                  ? 'bg-[#2563EB] text-white shadow-[0_0_12px_rgba(37,99,235,0.35)]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              Workouts Log
            </button>
            <button
              onClick={() => onChangeView('exercises')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeView === 'exercises'
                  ? 'bg-[#2563EB] text-white shadow-[0_0_12px_rgba(37,99,235,0.35)]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              Exercises & PRs
            </button>
            <button
              onClick={() => onChangeView('muscles')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeView === 'muscles'
                  ? 'bg-[#2563EB] text-white shadow-[0_0_12px_rgba(37,99,235,0.35)]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              Muscle Balance
            </button>
          </nav>
        )}

        {/* Zone 3: Primary Action & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Unit Toggle Switch */}
          <div className="flex items-center bg-[#111A2E] p-0.5 rounded-lg border border-[#1E293B] text-xs font-semibold">
            <button
              onClick={() => onToggleUnit('kg')}
              className={`px-2.5 py-1 rounded-md transition-all ${
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
              className={`px-2.5 py-1 rounded-md transition-all ${
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
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#131D31] text-[#E2E8F0] rounded-xl border border-[#1E293B] max-w-[180px]">
              <FileText className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
              <span className="truncate">{activeDataset.filename}</span>
            </div>
          )}

          {/* Clear CSV Button (if loaded) */}
          {activeDataset && (
            <button
              onClick={onClearData}
              className="p-2 text-xs font-medium text-[#94A3B8] hover:text-[#F87171] hover:bg-[#1E293B] rounded-xl border border-[#1E293B] transition-colors"
              title="Clear loaded CSV"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-95 transition-all rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.35)] whitespace-nowrap shrink-0"
          >
            <UploadCloud className="w-4 h-4" />
            <span className="hidden sm:inline">{activeDataset ? 'Upload New CSV' : 'Upload Hevy CSV'}</span>
            <span className="sm:hidden">Upload</span>
          </button>
        </div>
      </div>

      {/* Mobile view navigation tab bar */}
      {activeDataset && (
        <div className="md:hidden flex items-center justify-between gap-1 mt-3 pt-2 border-t border-[#1E293B] overflow-x-auto pb-1">
          <button
            onClick={() => onChangeView('overview')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeView === 'overview' ? 'bg-[#2563EB] text-white' : 'text-[#94A3B8]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onChangeView('workouts')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeView === 'workouts' ? 'bg-[#2563EB] text-white' : 'text-[#94A3B8]'
            }`}
          >
            Workouts ({activeDataset.workoutCount})
          </button>
          <button
            onClick={() => onChangeView('exercises')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeView === 'exercises' ? 'bg-[#2563EB] text-white' : 'text-[#94A3B8]'
            }`}
          >
            Exercises & PRs
          </button>
          <button
            onClick={() => onChangeView('muscles')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeView === 'muscles' ? 'bg-[#2563EB] text-white' : 'text-[#94A3B8]'
            }`}
          >
            Muscle Splits
          </button>
        </div>
      )}
    </header>
  );
};
