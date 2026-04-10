import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { hook } = await req.json();

    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are an elite retention-strategist for short-form video. Analyze the provided video hook. Be ruthless, objective, and highly analytical. Reward curiosity gaps and strong visual cues. Penalize slow starts, cliché phrasing, and weak energy.',
      prompt: `Analyze this 3-second hook script: "${hook}"`,
      schema: z.object({
        score: z.number().min(1).max(100).describe('Virality probability score 1-100'),
        curiosity: z.enum(['Low', 'Medium', 'High']).describe('Level of curiosity gap created'),
        energy: z.string().describe('A short 4-5 word directive for the editor/speaker regarding energy or visual pattern interrupt'),
        feedback: z.string().describe('Direct, 2-sentence critique explaining the score and what is missing.'),
        rewrite: z.string().nullable().describe('If the score is below 80, provide a better, punchier rewrite. If above 80, return null.')
      }),
    });

    return NextResponse.json(result.object);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to score hook' }, { status: 500 });
  }
}