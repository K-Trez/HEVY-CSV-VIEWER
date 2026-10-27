import React, { useState, useMemo } from 'react';
import { UnitPreference, DatasetInfo, Workout } from './types/workout';
import { parseHevyCSV, ParsedHevyData } from './utils/hevyParser';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { HeatmapCalendar } from './components/HeatmapCalendar';
import { WorkoutList } from './components/WorkoutList';
import { RoutinesView } from './components/RoutinesView';
import { ExerciseAnalytics } from './components/ExerciseAnalytics';
import { MuscleDistribution } from './components/MuscleDistribution';
import { MuscleRadarChart } from './components/MuscleRadarChart';
import { UploadModal } from './components/UploadModal';
import { WorkoutDetailModal } from './components/WorkoutDetailModal';
import { Dumbbell, ArrowRight, Trophy, UploadCloud, FileSpreadsheet, Smartphone, AlertCircle } from 'lucide-react';

export default function App() {
  const [unit, setUnit] = useState<UnitPreference>(() => {
    return (localStorage.getItem('hevy_unit_pref') as UnitPreference) || 'kg';
  });

  // Load saved CSV from localStorage if available
  const [savedData] = useState<{ csvText: string; filename: string } | null>(() => {
    const csv = localStorage.getItem('hevy_saved_csv');
    const filename = localStorage.getItem('hevy_saved_filename') || 'workout_data.csv';
    if (csv && csv.trim().length > 0) {
      return { csvText: csv, filename };
    }
    return null;
  });

  const [activeDataset, setActiveDataset] = useState<DatasetInfo | null>(() => {
    if (savedData) {
      const parsed = parseHevyCSV(savedData.csvText);
      const dateRangeStr = parsed.dateRange.start && parsed.dateRange.end
        ? `${parsed.dateRange.start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} – ${parsed.dateRange.end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
        : 'All time';
      return {
        id: 'saved-data',
        name: savedData.filename.replace(/\.csv$/i, ''),
        description: `Loaded ${parsed.totalWorkouts} workouts`,
        filename: savedData.filename,
        workoutCount: parsed.totalWorkouts,
        dateRange: dateRangeStr,
      };
    }
    return null;
  });

  const [parsedData, setParsedData] = useState<ParsedHevyData | null>(() => {
    if (savedData) {
      return parseHevyCSV(savedData.csvText);
    }
    return null;
  });

  const [activeView, setActiveView] = useState<'overview' | 'workouts' | 'routines' | 'exercises' | 'muscles'>('overview');
  const [selectedWorkoutForModal, setSelectedWorkoutForModal] = useState<Workout | null>(null);
  const [selectedExerciseForAnalytics, setSelectedExerciseForAnalytics] = useState<string | undefined>(undefined);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Sync unit preference with localStorage
  const handleToggleUnit = (newUnit: UnitPreference) => {
    setUnit(newUnit);
    localStorage.setItem('hevy_unit_pref', newUnit);
  };

  // Load custom user CSV and save to localStorage
  const handleLoadCustomCSV = (csvText: string, filename: string) => {
    try {
      const parsed = parseHevyCSV(csvText);
      if (parsed.workouts.length === 0) {
        setUploadError('Could not find any workouts in this CSV. Please make sure this is your Hevy workout_data.csv export.');
        return;
      }

      localStorage.setItem('hevy_saved_csv', csvText);
      localStorage.setItem('hevy_saved_filename', filename);

      const dateRangeStr = parsed.dateRange.start && parsed.dateRange.end
        ? `${parsed.dateRange.start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} – ${parsed.dateRange.end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
        : 'All time';

      setActiveDataset({
        id: `file-${Date.now()}`,
        name: filename.replace(/\.csv$/i, ''),
        description: `Loaded ${parsed.totalWorkouts} workouts`,
        filename,
        workoutCount: parsed.totalWorkouts,
        dateRange: dateRangeStr,
      });
      setParsedData(parsed);
      setUploadError(null);
    } catch (err: any) {
      setUploadError(`Error parsing CSV: ${err.message || 'Invalid format'}`);
    }
  };

  const handleClearData = () => {
    localStorage.removeItem('hevy_saved_csv');
    localStorage.removeItem('hevy_saved_filename');
    setActiveDataset(null);
    setParsedData(null);
  };

  // Drag and drop handlers for landing page
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    setUploadError(null);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Please select a valid .csv file exported from Hevy (e.g. workout_data.csv).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content || content.trim().length === 0) {
        setUploadError('The selected file appears to be empty.');
        return;
      }
      handleLoadCustomCSV(content, file.name);
    };
    reader.readAsText(file);
  };

  // Total PRs count across all workouts
  const totalPRs = useMemo(() => {
    if (!parsedData) return 0;
    return parsedData.workouts.reduce(
      (total, w) => total + w.exercises.reduce((exTotal, ex) => exTotal + ex.sets.filter(s => s.isPR).length, 0),
      0
    );
  }, [parsedData]);

  // Date range formatted string
  const dateRangeStr = useMemo(() => {
    if (parsedData?.dateRange.start && parsedData?.dateRange.end) {
      return `${parsedData.dateRange.start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} – ${parsedData.dateRange.end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }
    return 'All time';
  }, [parsedData?.dateRange]);

  const handleDrillDownExercise = (exerciseTitle: string) => {
    setSelectedExerciseForAnalytics(exerciseTitle);
    setActiveView('exercises');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('hevy_vault_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const handleToggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('hevy_vault_theme', next);
      return next;
    });
  };

  // Theme tokens live on the root element so the page background, scrollbars and
  // overscroll gutter all follow the active theme.
  React.useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light');
  }, [theme]);

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200 overflow-x-hidden bg-void text-chalk">
      {/* Navigation Header */}
      <Header
        unit={unit}
        onToggleUnit={handleToggleUnit}
        activeDataset={activeDataset}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onClearData={handleClearData}
        activeView={activeView}
        onChangeView={setActiveView}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* If NO data is loaded: Landing / Upload Dropzone Screen */}
        {!parsedData && (
          <div className="max-w-2xl mx-auto py-12 space-y-6 animate-in fade-in">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-tint-plate text-plate border border-plate/20 flex items-center justify-center mx-auto">
                <Dumbbell className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-chalk">
                Hevy Workout Vault
              </h1>
              <p className="text-sm text-dust max-w-md mx-auto">
                Upload your <code className="bg-raised px-1.5 py-0.5 rounded text-plate">workout_data.csv</code> to explore your all-time workout logs, 1RM progression charts, and muscle splits.
              </p>
            </div>

            {uploadError && (
              <div className="p-3.5 rounded-lg bg-tint-ply/60 border border-danger/25 text-danger text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Drag & Drop Zone */}
            <div
              onDrop={handleFileDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              className={`border border-dashed rounded-xl p-10 text-center transition-colors bg-surface ${
                dragActive
                  ? 'border-plate bg-tint-plate/50'
                  : 'border-line-strong hover:border-plate/50'
              }`}
            >
              <UploadCloud className="w-9 h-9 text-ash mx-auto mb-4" />
              <div className="text-sm font-semibold text-chalk">
                Drag and drop your Hevy workout_data.csv
              </div>
              <p className="text-xs text-dust mt-1.5">
                Processed 100% locally on your computer with complete privacy
              </p>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <label className="px-4 py-2 text-[13px] font-medium text-white bg-ply hover:bg-ply-deep rounded-lg shadow-sm cursor-pointer transition-colors duration-150">
                  Choose CSV file
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2 text-[13px] font-medium text-chalk-2 bg-surface hover:bg-raised border border-line rounded-lg transition-colors duration-150"
                >
                  Paste CSV text
                </button>
              </div>
            </div>

            {/* Quick Export Guide */}
            <div className="bg-surface rounded-xl p-5 border border-line text-xs text-dust">
              <div className="font-semibold text-chalk flex items-center gap-2 mb-2.5">
                <Smartphone className="w-4 h-4 text-plate" />
                How to get your CSV file from Hevy:
              </div>
              <ol className="list-decimal pl-5 space-y-1.5 text-[11px] leading-relaxed">
                <li>Open the <strong>Hevy app</strong> on your phone.</li>
                <li>Go to the <strong>Profile</strong> tab and tap the <strong>Settings gear icon</strong> in the upper right.</li>
                <li>Scroll down to <strong>Export Data</strong> and select <strong>Export as CSV</strong>.</li>
                <li>Drop the downloaded <code className="bg-void px-1.5 py-0.5 rounded text-plate">workout_data.csv</code> file into the box above.</li>
              </ol>
            </div>
          </div>
        )}

        {/* If data IS loaded: Full Application Dashboard */}
        {parsedData && activeDataset && (
          <>
            {/* Top status bar */}
            <div className="bg-surface border border-line rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-raised text-ash flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-chalk flex items-center gap-2">
                    <span>{activeDataset.filename}</span>
                    <span className="text-[10px] text-dust font-mono bg-raised px-2 py-0.5 rounded-[4px] border border-line">
                      {parsedData.totalWorkouts} workouts
                    </span>
                  </div>
                  <div className="text-[11px] text-dust mt-0.5">
                    {dateRangeStr} · Displaying in <strong className="text-plate">{unit}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="text-xs font-semibold text-plate hover:underline px-2 py-1"
                >
                  Upload another CSV
                </button>
              </div>
            </div>

            {/* VIEW 1: OVERVIEW */}
            {activeView === 'overview' && (
              <div className="space-y-6 animate-in fade-in">
                {/* Metric Strip */}
                <MetricCards
                  totalWorkouts={parsedData.totalWorkouts}
                  totalVolumeKg={parsedData.totalLifetimeVolumeKg}
                  totalVolumeLbs={parsedData.totalLifetimeVolumeLbs}
                  totalSets={parsedData.totalSets}
                  totalReps={parsedData.totalReps}
                  totalHours={parsedData.totalHours}
                  totalPRs={totalPRs}
                  unit={unit}
                  dateRangeStr={dateRangeStr}
                />

                {/* Activity Heatmap Calendar (At the top, not bottom!) */}
                <HeatmapCalendar
                  workouts={parsedData.workouts}
                  unit={unit}
                  onSelectWorkout={setSelectedWorkoutForModal}
                  theme={theme}
                />

                {/* Radar Chart (Spider Chart / Web Chart) on the Overview Tab */}
                <MuscleRadarChart
                  workouts={parsedData.workouts}
                  unit={unit}
                  theme={theme}
                  onSelectCategory={(_muscle) => {
                    setActiveView('muscles');
                  }}
                />

                {/* Split Row: Recent Workouts & Key Milestones */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                  {/* Left Column: Recent Workouts preview */}
                  <div className="lg:col-span-7 bg-surface rounded-xl p-4 sm:p-5 border border-line shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-semibold text-chalk flex items-center gap-2">
                            <Dumbbell className="w-4 h-4 text-plate" />
                            Recent Training Sessions
                          </h3>
                          <p className="text-xs text-dust mt-0.5">
                            Latest logged workouts from your export
                          </p>
                        </div>

                        <button
                          onClick={() => setActiveView('workouts')}
                          className="text-xs font-semibold text-plate hover:underline flex items-center gap-1 hover:translate-x-0.5 duration-150"
                        >
                          <span>View All ({parsedData.totalWorkouts})</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="divide-y divide-line">
                        {parsedData.workouts.slice(0, 5).map(w => {
                          const vol = unit === 'kg' ? w.totalVolumeKg : w.totalVolumeLbs;
                          return (
                            <div
                              key={w.id}
                              onClick={() => setSelectedWorkoutForModal(w)}
                              className="py-3 flex items-center justify-between gap-3 hover:bg-raised/40 px-2.5 rounded-lg cursor-pointer transition-colors duration-150"
                            >
                              <div className="min-w-0 pr-1">
                                <div className="font-semibold text-xs sm:text-sm text-chalk truncate">
                                  {w.title}
                                </div>
                                <div className="text-[11px] text-dust mt-0.5 truncate">
                                  {w.startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                  {' · '}{w.durationMinutes} min · {w.exercises.length} exs
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-semibold text-xs sm:text-sm text-chalk tabular-nums font-mono">
                                  {vol.toLocaleString()} {unit}
                                </div>
                                <div className="text-[10px] text-dust">
                                  {w.totalSets} sets
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-line text-center">
                      <button
                        onClick={() => setActiveView('workouts')}
                        className="w-full py-2.5 text-xs font-semibold text-chalk-2 bg-void hover:bg-raised rounded-lg transition-colors duration-150 border border-line"
                      >
                        Open Full Workout Log Explorer
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Top Exercises & PR Hall */}
                  <div className="lg:col-span-5 bg-surface rounded-xl p-4 sm:p-5 border border-line shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-semibold text-chalk flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-plate" />
                            Key Exercise Milestones
                          </h3>
                          <p className="text-xs text-dust mt-0.5">
                            Heaviest loads and estimated 1RMs
                          </p>
                        </div>

                        <button
                          onClick={() => setActiveView('exercises')}
                          className="text-xs font-semibold text-plate hover:underline flex items-center gap-1 hover:translate-x-0.5 duration-150"
                        >
                          <span>Explore</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        {Object.values(parsedData.exerciseStats)
                          .sort((a, b) => b.totalSets - a.totalSets)
                          .slice(0, 5)
                          .map(ex => {
                            const topWeight = unit === 'kg' ? ex.allTimeMaxWeightKg : ex.allTimeMaxWeightLbs;
                            const top1RM = unit === 'kg' ? ex.allTimeEstimated1RMKg : ex.allTimeEstimated1RMLbs;

                            return (
                              <div
                                key={ex.exerciseTitle}
                                onClick={() => handleDrillDownExercise(ex.exerciseTitle)}
                                className="p-2.5 rounded-lg bg-void border border-line hover:border-plate/50 flex items-center justify-between cursor-pointer transition-colors duration-150 active:scale-[0.99]"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="font-semibold text-xs text-chalk truncate">
                                    {ex.exerciseTitle}
                                  </div>
                                  <div className="text-[10px] text-dust mt-0.5">
                                    {ex.muscleGroup} · {ex.totalSets} sets
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <div className="font-semibold text-xs text-chalk tabular-nums font-mono">
                                    {topWeight > 0 ? `${topWeight} ${unit}` : 'BW'}
                                  </div>
                                  <div className="text-[10px] text-plate font-semibold tabular-nums font-mono">
                                    Est. 1RM: {top1RM} {unit}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-line text-center">
                      <button
                        onClick={() => setActiveView('muscles')}
                        className="w-full py-2.5 text-xs font-semibold text-chalk-2 bg-void hover:bg-raised rounded-lg transition-colors duration-150 border border-line"
                      >
                        Check Kinetic Muscle Balance (Push/Pull/Legs)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: WORKOUTS LOG */}
            {activeView === 'workouts' && (
              <div className="animate-in fade-in">
                <WorkoutList
                  workouts={parsedData.workouts}
                  unit={unit}
                  onSelectWorkout={setSelectedWorkoutForModal}
                  onSelectExercise={handleDrillDownExercise}
                />
              </div>
            )}

            {/* VIEW 3: ROUTINES */}
            {activeView === 'routines' && (
              <div className="animate-in fade-in">
                <RoutinesView workouts={parsedData.workouts} unit={unit} />
              </div>
            )}

            {/* VIEW 4: EXERCISES & PRS */}
            {activeView === 'exercises' && (
              <div className="animate-in fade-in">
                <ExerciseAnalytics
                  exerciseStats={parsedData.exerciseStats}
                  unit={unit}
                  initialSelectedExercise={selectedExerciseForAnalytics}
                  theme={theme}
                />
              </div>
            )}

            {/* VIEW 5: MUSCLE BALANCE */}
            {activeView === 'muscles' && (
              <div className="animate-in fade-in">
                <MuscleDistribution
                  workouts={parsedData.workouts}
                  unit={unit}
                  onSelectExercise={handleDrillDownExercise}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onLoadCustomCSV={handleLoadCustomCSV}
      />

      <WorkoutDetailModal
        workout={selectedWorkoutForModal}
        unit={unit}
        onClose={() => setSelectedWorkoutForModal(null)}
        onDrillDownExercise={handleDrillDownExercise}
      />
    </div>
  );
}
