import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const { comments, taskTitle } = await req.json();

    if (!comments || comments.length === 0) {
      return NextResponse.json({ summary: ["No comments to summarize yet."] });
    }

    const commentString = comments.map((c: any) => `[${c.time}] ${c.author}: ${c.text}`).join('\n');

    const result = await generateObject({
      model: google('gemini-1.5-flash'),
      system: 'You are an elite video editing assistant. The user will give you a list of scattered, unorganized client comments attached to video timestamps. Your job is to analyze them, group similar requests together, and output a ruthless, highly actionable 3-point revision checklist for the video editor.',
      prompt: `Analyze these comments for the video "${taskTitle}":\n\n${commentString}\n\nGive me a 3-point revision action plan.`,
      schema: z.object({
        action_plan: z.array(z.string()).max(3).describe('A list of exactly 1 to 3 highly actionable bullet points summarizing the changes the editor needs to make.')
      }),
    });

    return NextResponse.json(result.object);
  } catch (error: any) {
    console.error('AI Summary Error:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}