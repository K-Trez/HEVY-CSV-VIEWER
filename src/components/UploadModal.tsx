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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#0B0F17]/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#131D31] rounded-2xl sm:rounded-3xl max-w-xl w-full border border-[#1E293B] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-[#1E3A8A]/40 text-[#60A5FA] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#F8FAFC]">
                Load Hevy Workout Data
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Import your Hevy CSV export to view all your training history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-[#0B0F17] text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC] flex items-center justify-center transition-all duration-150 hover:-translate-y-0.5 active:scale-95 border border-[#1E293B] shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-[#1E293B] px-4 sm:px-6 bg-[#0B0F17]/40 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-[#3B82F6] text-[#38BDF8]'
                : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'paste'
                ? 'border-[#3B82F6] text-[#38BDF8]'
                : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            Paste Text
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-[#7F1D1D]/30 border border-[#DC2626]/40 text-[#FCA5A5] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  dragActive
                    ? 'border-[#3B82F6] bg-[#1E3A8A]/20'
                    : 'border-[#1E293B] bg-[#0B0F17] hover:border-[#3B82F6]/60'
                }`}
              >
                <UploadCloud className="w-10 h-10 text-[#38BDF8] mx-auto mb-3" />
                <div className="text-sm font-bold text-[#F8FAFC]">
                  Drag and drop your Hevy CSV file here
                </div>
                <div className="text-xs text-[#94A3B8] mt-1">
                  Supports <code className="bg-[#1E293B] px-1.5 py-0.5 rounded text-[#38BDF8]">workout_data.csv</code>
                </div>

                <div className="mt-4">
                  <label className="inline-block px-4 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-md shadow-sm cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-95">
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
                <div className="p-4 rounded-xl bg-[#064E3B]/30 border border-[#059669]/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-[#10B981] text-white flex items-center justify-center">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#F8FAFC]">{previewData.filename}</div>
                      <div className="text-[11px] text-[#34D399]">
                        {previewData.workoutCount} workouts · {previewData.setCount} sets parsed successfully
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={confirmPreviewLoad}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#10B981] hover:bg-[#059669] rounded-md transition-all duration-150 hover:-translate-y-0.5 active:scale-95 shadow-sm"
                  >
                    Load Data
                  </button>
                </div>
              )}

              {/* How to export guidance */}
              <div className="bg-[#0B0F17] rounded-xl p-4 border border-[#1E293B] text-xs text-[#94A3B8]">
                <div className="font-bold text-[#F8FAFC] flex items-center gap-1.5 mb-2">
                  <Smartphone className="w-3.5 h-3.5 text-[#38BDF8]" />
                  How to export from Hevy app:
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                  <li>Open the <strong>Hevy app</strong> on your phone.</li>
                  <li>Go to <strong>Profile</strong> tab $\rightarrow$ Tap the <strong>Settings gear</strong> in the top right.</li>
                  <li>Scroll down to <strong>Export Data</strong> and select CSV.</li>
                  <li>Save or air-drop the downloaded <code className="bg-[#1E293B] px-1 rounded text-[#38BDF8]">workout_data.csv</code> here.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#F8FAFC] mb-1.5">
                  Paste raw CSV text:
                </label>
                <textarea
                  value={pastedCSV}
                  onChange={(e) => setPastedCSV(e.target.value)}
                  placeholder="title,start_time,end_time,description,exercise_title,..."
                  rows={8}
                  className="w-full p-3 text-xs font-mono bg-[#0B0F17] border border-[#1E293B] rounded-md text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
              <button
                onClick={handlePasteSubmit}
                className="w-full py-2.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-md transition-all duration-150 hover:-translate-y-0.5 active:scale-95 shadow-sm"
              >
                Parse and Load Workouts
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#0B0F17]/60 border-t border-[#1E293B] flex items-center justify-between text-xs text-[#64748B]">
          <span>100% private & client-side only</span>
          <button
            onClick={onClose}
            className="text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
