
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

const FeedbackSchema = z.object({
  content: z.string().min(10),
  userId: z.string().nullable(),
});

export async function submitFeedback(input: { content: string; userId: string | null }) {
  const validation = FeedbackSchema.safeParse(input);

  if (!validation.success) {
    throw new Error('Invalid feedback data.');
  }

  const { content, userId } = validation.data;

  try {
    await addDoc(collection(db, 'feedback'), {
      content,
      userId,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error writing feedback to Firestore:', error);
    throw new Error('Could not submit feedback.');
  }
}
