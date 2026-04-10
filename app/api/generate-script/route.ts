import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { idea } = await req.json();

    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a high-ticket creative director for a luxury video marketing agency. Transform raw client ideas into high-retention, fast-paced short-form video scripts (TikTok/Reels format). Maintain an authoritative, direct, "Hormozi-style" tone. No fluff.',
      prompt: `Transform this raw concept into a production brief: "${idea}"`,
      schema: z.object({
        hook: z.string().describe('A punchy, pattern-interrupting 3-second hook.'),
        value: z.string().describe('The core value proposition or educational payload (15-20 seconds).'),
        cta: z.string().describe('A strong, direct call to action (5 seconds).')
      }),
    });

    return NextResponse.json(result.object);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate script' }, { status: 500 });
  }
}