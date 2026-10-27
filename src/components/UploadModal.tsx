import React, { useState } from 'react';
import { parseHevyCSV } from '../utils/hevyParser';
import { X, UploadCloud, FileSpreadsheet, Check, AlertCircle, Smartphone } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadCustomCSV: (csvText: string, filename: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onLoadCustomCSV,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedCSV, setPastedCSV] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState<{
    workoutCount: number;
    setCount: number;
    filename: string;
    csvText: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    closeButtonRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    setErrorMessage(null);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Please upload a valid .csv file exported from Hevy (e.g. workout_data.csv).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content || content.trim().length === 0) {
        setErrorMessage('The uploaded file appears to be empty.');
        return;
      }

      try {
        const parsed = parseHevyCSV(content);
        if (parsed.workouts.length === 0) {
          setErrorMessage('Could not find any workouts in this CSV. Please make sure this is your Hevy workout_data.csv export.');
          return;
        }

        setPreviewData({
          workoutCount: parsed.workouts.length,
          setCount: parsed.totalSets,
          filename: file.name,
          csvText: content,
        });
      } catch (err: any) {
        setErrorMessage(`Error parsing CSV: ${err.message || 'Invalid format'}`);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handlePasteSubmit = () => {
    setErrorMessage(null);
    if (!pastedCSV.trim()) {
      setErrorMessage('Please paste your CSV text first.');
      return;
    }

    try {
      const parsed = parseHevyCSV(pastedCSV);
      if (parsed.workouts.length === 0) {
        setErrorMessage('No valid workout rows detected. Ensure the CSV contains title, start_time, and exercise_title.');
        return;
      }

      onLoadCustomCSV(pastedCSV, 'workout_data.csv');
      onClose();
    } catch (err: any) {
      setErrorMessage(`Error parsing pasted data: ${err.message || 'Invalid CSV format'}`);
    }
  };

  const confirmPreviewLoad = () => {
    if (previewData) {
      onLoadCustomCSV(previewData.csvText, previewData.filename);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-void/80 backdrop-blur-md animate-in fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
        className="bg-surface rounded-xl max-w-xl w-full border border-line shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-tint-steel/40 text-steel flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 id="upload-modal-title" className="text-sm sm:text-base font-semibold text-chalk">
                Load Hevy Workout Data
              </h3>
              <p className="text-xs text-dust mt-0.5">
                Import your Hevy CSV export to view all your training history
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close upload dialog"
            className="w-8 h-8 rounded-lg bg-void text-dust hover:bg-raised hover:text-chalk flex items-center justify-center transition-colors duration-150 border border-line shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          role="tablist"
          aria-label="Import method"
          className="flex items-center border-b border-line px-4 sm:px-6 bg-void/40 text-xs font-semibold"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'upload'}
            aria-controls="upload-panel"
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-plate text-plate'
                : 'border-transparent text-dust hover:text-chalk'
            }`}
          >
            Upload File
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'paste'}
            aria-controls="paste-panel"
            onClick={() => setActiveTab('paste')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'paste'
                ? 'border-plate text-plate'
                : 'border-transparent text-dust hover:text-chalk'
            }`}
          >
            Paste Text
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-tint-ply/60 border border-danger/25 text-danger text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'upload' && (
            <div role="tabpanel" id="upload-panel" className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-plate bg-tint-plate/50'
                    : 'border-line bg-void hover:border-plate/60'
                }`}
              >
                <UploadCloud className="w-10 h-10 text-plate mx-auto mb-3" />
                <div className="text-sm font-semibold text-chalk">
                  Drag and drop your Hevy CSV file here
                </div>
                <div className="text-xs text-dust mt-1">
                  Supports <code className="bg-raised px-1.5 py-0.5 rounded text-plate">workout_data.csv</code>
                </div>

                <div className="mt-4">
                  <label className="inline-block px-4 py-2 text-xs font-semibold text-white bg-ply hover:bg-ply-deep rounded-lg shadow-sm cursor-pointer transition-colors duration-150">
                    Browse Computer
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileProcess(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Ready Preview */}
              {previewData && (
                <div className="p-4 rounded-lg bg-tint-grn/30 border border-grn/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-grn text-void flex items-center justify-center">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-chalk">{previewData.filename}</div>
                      <div className="text-[11px] text-grn">
                        {previewData.workoutCount} workouts · {previewData.setCount} sets parsed successfully
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={confirmPreviewLoad}
                    className="px-4 py-2 text-xs font-semibold text-void bg-grn hover:brightness-105 rounded-lg transition-colors duration-150 shadow-sm"
                  >
                    Load Data
                  </button>
                </div>
              )}

              {/* How to export guidance */}
              <div className="bg-void rounded-lg p-4 border border-line text-xs text-dust">
                <div className="font-semibold text-chalk flex items-center gap-1.5 mb-2">
                  <Smartphone className="w-3.5 h-3.5 text-plate" />
                  How to export from Hevy app:
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                  <li>Open the <strong>Hevy app</strong> on your phone.</li>
                  <li>Go to <strong>Profile</strong> tab → Tap the <strong>Settings gear</strong> in the top right.</li>
                  <li>Scroll down to <strong>Export Data</strong> and select CSV.</li>
                  <li>Save or air-drop the downloaded <code className="bg-raised px-1 rounded text-plate">workout_data.csv</code> here.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div role="tabpanel" id="paste-panel" className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-chalk mb-1.5">
                  Paste raw CSV text:
                </label>
                <textarea
                  value={pastedCSV}
                  onChange={(e) => setPastedCSV(e.target.value)}
                  placeholder="title,start_time,end_time,description,exercise_title,..."
                  rows={8}
                  className="w-full p-3 text-xs font-mono bg-void border border-line rounded-lg text-chalk focus:outline-none focus:border-plate"
                />
              </div>
              <button
                onClick={handlePasteSubmit}
                className="w-full py-2.5 text-xs font-semibold text-white bg-ply hover:bg-ply-deep rounded-lg transition-colors duration-150 shadow-sm"
              >
                Parse and Load Workouts
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-void/60 border-t border-line flex items-center justify-between text-xs text-ash">
          <span>100% private & client-side only</span>
          <button
            onClick={onClose}
            className="text-xs font-medium text-dust hover:text-chalk"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
