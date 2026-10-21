import { MuscleGroup } from '../types/workout';

// Dictionary mapping common exercise name keywords to primary and secondary muscle groups
const EXERCISE_MAPPINGS: Array<{
  pattern: RegExp;
  primary: MuscleGroup;
  secondary?: MuscleGroup;
}> = [
  // Chest
  { pattern: /bench press|chest press|incline press|decline press|dumbbell press|chest fly|pec deck|cable fly|push up|dip/i, primary: 'Chest', secondary: 'Triceps' },
  
  // Back
  { pattern: /pull up|chin up|lat pulldown|pulldown|pull-up/i, primary: 'Back', secondary: 'Biceps' },
  { pattern: /barbell row|dumbbell row|t-bar row|cable row|chest supported row|pendlay row|seated row|inverted row/i, primary: 'Back', secondary: 'Biceps' },
  { pattern: /deadlift|rack pull|good morning/i, primary: 'Back', secondary: 'Hamstrings' },
  { pattern: /shrug|upright row/i, primary: 'Back', secondary: 'Shoulders' },
  { pattern: /lat prayer|straight arm pulldown|pullover/i, primary: 'Back' },

  // Shoulders
  { pattern: /overhead press|military press|shoulder press|arnold press|push press/i, primary: 'Shoulders', secondary: 'Triceps' },
  { pattern: /lateral raise|side lateral|deltoid raise/i, primary: 'Shoulders' },
  { pattern: /face pull|rear delt|reverse fly/i, primary: 'Shoulders', secondary: 'Back' },
  { pattern: /front raise/i, primary: 'Shoulders' },

  // Quads
  { pattern: /squat|front squat|hack squat|leg press|safety bar squat/i, primary: 'Quads', secondary: 'Glutes' },
  { pattern: /leg extension|quad extension/i, primary: 'Quads' },
  { pattern: /lunge|split squat|bulgarian split squat|step up/i, primary: 'Quads', secondary: 'Glutes' },

  // Hamstrings & Glutes
  { pattern: /romanian deadlift|rdl|stiff leg deadlift/i, primary: 'Hamstrings', secondary: 'Glutes' },
  { pattern: /leg curl|hamstring curl/i, primary: 'Hamstrings' },
  { pattern: /hip thrust|glute bridge|kickback|hyperextension/i, primary: 'Glutes', secondary: 'Hamstrings' },

  // Arms - Biceps
  { pattern: /bicep curl|hammer curl|preacher curl|spider curl|concentration curl|incline curl|cable curl|ez bar curl/i, primary: 'Biceps' },

  // Arms - Triceps
  { pattern: /tricep|skull crusher|pushdown|french press|jm press|kickback|triceps extension/i, primary: 'Triceps' },

  // Calves
  { pattern: /calf raise|calves|seated calf|standing calf/i, primary: 'Calves' },

  // Core
  { pattern: /ab wheel|crunch|hanging leg raise|leg raise|plank|cable crunch|woodchopper|russian twist|sit up/i, primary: 'Core' },

  // Cardio / Running
  { pattern: /running|treadmill|cycling|bike|rower|rowing machine|elliptical|stairmaster|jump rope/i, primary: 'Cardio' },
];

export function categorizeExercise(title: string): { primary: MuscleGroup; secondary?: MuscleGroup } {
  const cleanTitle = title.trim();
  for (const mapping of EXERCISE_MAPPINGS) {
    if (mapping.pattern.test(cleanTitle)) {
      return { primary: mapping.primary, secondary: mapping.secondary };
    }
  }
  return { primary: 'Full Body' };
}

// Dark mode optimized color palette with electric blue, cyan, indigo, and emerald accents
export const MUSCLE_COLORS: Record<MuscleGroup, { bg: string; text: string; bar: string; border: string }> = {
  Chest: { bg: 'bg-[#1E3A8A]/30', text: 'text-[#60A5FA]', bar: 'bg-[#3B82F6]', border: 'border-[#2563EB]/40' },
  Back: { bg: 'bg-[#064E3B]/30', text: 'text-[#34D399]', bar: 'bg-[#10B981]', border: 'border-[#059669]/40' },
  Shoulders: { bg: 'bg-[#1E293B]', text: 'text-[#38BDF8]', bar: 'bg-[#0EA5E9]', border: 'border-[#0284C7]/40' },
  Quads: { bg: 'bg-[#312E81]/30', text: 'text-[#A5B4FC]', bar: 'bg-[#6366F1]', border: 'border-[#4F46E5]/40' },
  Hamstrings: { bg: 'bg-[#4C1D95]/30', text: 'text-[#C084FC]', bar: 'bg-[#9333EA]', border: 'border-[#7E22CE]/40' },
  Glutes: { bg: 'bg-[#831843]/30', text: 'text-[#F472B6]', bar: 'bg-[#EC4899]', border: 'border-[#DB2777]/40' },
  Biceps: { bg: 'bg-[#0C4A6E]/30', text: 'text-[#38BDF8]', bar: 'bg-[#0284C7]', border: 'border-[#0369A1]/40' },
  Triceps: { bg: 'bg-[#1E1B4B]/40', text: 'text-[#818CF8]', bar: 'bg-[#4F46E5]', border: 'border-[#3730A3]/40' },
  Core: { bg: 'bg-[#14532D]/30', text: 'text-[#4ADE80]', bar: 'bg-[#22C55E]', border: 'border-[#16A34A]/40' },
  Calves: { bg: 'bg-[#1E293B]/50', text: 'text-[#94A3B8]', bar: 'bg-[#64748B]', border: 'border-[#475569]/40' },
  'Full Body': { bg: 'bg-[#1E293B]', text: 'text-[#CBD5E1]', bar: 'bg-[#3B82F6]', border: 'border-[#334155]' },
  Cardio: { bg: 'bg-[#164E63]/30', text: 'text-[#2DD4BF]', bar: 'bg-[#14B8A6]', border: 'border-[#0D9488]/40' },
};
