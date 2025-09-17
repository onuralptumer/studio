
'use server';

import {
  generateMotivationalNudge,
  type GenerateMotivationalNudgeInput,
} from '@/ai/flows/generate-motivational-nudges';

export async function getMotivationalNudge(
  input: GenerateMotivationalNudgeInput
): Promise<string> {
  try {
    const result = await generateMotivationalNudge(input);
    return result.nudge;
  } catch (error) {
    console.error('Error generating motivational nudge:', error);
    // Return a graceful fallback message
    return "Keep up the great work!";
  }
}
