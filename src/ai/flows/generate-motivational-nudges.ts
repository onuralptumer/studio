'use server';

/**
 * @fileOverview AI-powered motivational nudge generator for focus sessions.
 *
 * - generateMotivationalNudge - Generates a personalized motivational nudge.
 * - GenerateMotivationalNudgeInput - The input type for the generateMotivationalNudge function.
 * - GenerateMotivationalNudgeOutput - The return type for the generateMotivationalNudge function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMotivationalNudgeInputSchema = z.object({
  task: z.string().describe('The current task the user is focusing on.'),
  timeElapsedMinutes: z
    .number()
    .describe('The number of minutes elapsed in the focus session.'),
  tone: z
    .enum(['calm', 'fun', 'firm'])
    .describe('The desired tone of the motivational nudge.'),
});
export type GenerateMotivationalNudgeInput = z.infer<
  typeof GenerateMotivationalNudgeInputSchema
>;

const GenerateMotivationalNudgeOutputSchema = z.object({
  nudge: z.string().describe('The generated motivational nudge.'),
});
export type GenerateMotivationalNudgeOutput = z.infer<
  typeof GenerateMotivationalNudgeOutputSchema
>;

export async function generateMotivationalNudge(
  input: GenerateMotivationalNudgeInput
): Promise<GenerateMotivationalNudgeOutput> {
  return generateMotivationalNudgeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMotivationalNudgePrompt',
  input: {schema: GenerateMotivationalNudgeInputSchema},
  output: {schema: GenerateMotivationalNudgeOutputSchema},
  prompt: `You are a motivational assistant helping users stay focused on their tasks.

  Generate a motivational nudge based on the following information:

  Task: {{{task}}}
  Time Elapsed: {{{timeElapsedMinutes}}} minutes
  Tone: {{{tone}}}

  The nudge should be concise and encouraging, tailored to the specified tone.
  `,
});

const generateMotivationalNudgeFlow = ai.defineFlow(
  {
    name: 'generateMotivationalNudgeFlow',
    inputSchema: GenerateMotivationalNudgeInputSchema,
    outputSchema: GenerateMotivationalNudgeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
