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

  // Arms - Forearms
  { pattern: /wrist curl|forearm|reverse curl|finger curl|grip|farmer walk|dead hang/i, primary: 'Forearms', secondary: 'Biceps' },

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

// Hue encodes movement pattern: push = accent blue, pull = violet, legs =
// emerald, core = gold. Every group is also labelled in text, so colour is
// never the only carrier of meaning.
const PUSH = { bg: 'bg-tint-plate/60', text: 'text-plate', bar: 'bg-plate', border: 'border-plate/30' };
const PULL = { bg: 'bg-tint-steel/60', text: 'text-steel', bar: 'bg-steel', border: 'border-steel/30' };
const LEGS = { bg: 'bg-tint-grn/60', text: 'text-grn', bar: 'bg-grn', border: 'border-grn/30' };
const CORE = { bg: 'bg-tint-gold/60', text: 'text-gold', bar: 'bg-gold', border: 'border-gold/30' };
const MISC = { bg: 'bg-raised', text: 'text-chalk-2', bar: 'bg-ash', border: 'border-line' };

export const MUSCLE_COLORS: Record<MuscleGroup, { bg: string; text: string; bar: string; border: string }> = {
  Chest: PUSH,
  Shoulders: PUSH,
  Triceps: PUSH,
  Back: PULL,
  Biceps: PULL,
  Forearms: PULL,
  Quads: LEGS,
  Hamstrings: LEGS,
  Glutes: LEGS,
  Calves: LEGS,
  Core: CORE,
  'Full Body': MISC,
  Cardio: MISC,
};
