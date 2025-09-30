
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

const FeedbackSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  content: z.string().min(10, 'Feedback must be at least 10 characters.'),
  userId: z.string().nullable(),
});

export async function submitFeedback(input: { name: string; email: string; content: string; userId: string | null }) {
  const validation = FeedbackSchema.safeParse(input);

  if (!validation.success) {
    // throw new Error('Invalid feedback data.');
    throw new Error(validation.error.errors.map(e => e.message).join(' '));
  }

  const { name, email, content, userId } = validation.data;

  try {
    await addDoc(collection(db, 'feedback'), {
      name,
      email,
      content,
      userId,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error writing feedback to Firestore:', error);
    throw new Error('Could not submit feedback.');
  }
}
