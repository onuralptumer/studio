'use server';

/**
 * @fileOverview Allows premium users to customize the tone of motivational nudges.
 *
 * - customizeNudgeTone - A function that generates a motivational nudge with a specified tone.
 * - CustomizeNudgeToneInput - The input type for the customizeNudgeTone function.
 * - CustomizeNudgeToneOutput - The return type for the customizeNudgeTone function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CustomizeNudgeToneInputSchema = z.object({
  task: z.string().describe('The current task the user is focusing on.'),
  tone: z
    .enum(['calm', 'fun', 'firm'])
    .describe('The desired tone of the motivational nudge.'),
  elapsedTime: z.number().describe('The elapsed time in minutes.'),
});
export type CustomizeNudgeToneInput = z.infer<typeof CustomizeNudgeToneInputSchema>;

const CustomizeNudgeToneOutputSchema = z.object({
  nudge: z.string().describe('The motivational nudge generated with the specified tone.'),
});
export type CustomizeNudgeToneOutput = z.infer<typeof CustomizeNudgeToneOutputSchema>;

export async function customizeNudgeTone(input: CustomizeNudgeToneInput): Promise<CustomizeNudgeToneOutput> {
  return customizeNudgeToneFlow(input);
}

const prompt = ai.definePrompt({
  name: 'customizeNudgeTonePrompt',
  input: {schema: CustomizeNudgeToneInputSchema},
  output: {schema: CustomizeNudgeToneOutputSchema},
  prompt: `You are a motivational assistant, providing nudges to help users focus on their tasks.

  Current task: {{{task}}}
  Elapsed time: {{{elapsedTime}}} minutes
  Desired tone: {{{tone}}}

  Generate a single motivational nudge with the specified tone.
  `,
});

const customizeNudgeToneFlow = ai.defineFlow(
  {
    name: 'customizeNudgeToneFlow',
    inputSchema: CustomizeNudgeToneInputSchema,
    outputSchema: CustomizeNudgeToneOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
