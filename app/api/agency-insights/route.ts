import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

// Explicitly initialize Google with your API key
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    // Failsafe check to see if the key is actually loaded
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY in .env.local file");
    }

    const { workload, bottlenecks, metrics } = await req.json();

    const result = await generateObject({
      model: google('gemini-1.5-flash'), 
      system: 'You are an elite, highly analytical Operations Director for a high-ticket video marketing agency. Your job is to analyze real-time pipeline data and give the agency owner ruthless, highly actionable directives to clear bottlenecks and maximize revenue. No fluff. Be direct.',
      prompt: `Analyze the current agency state:
        Metrics: ${JSON.stringify(metrics)}
        Editor Workload (Capacity is 5 tasks max): ${JSON.stringify(workload)}
        Pipeline Bottlenecks (Delayed tasks): ${JSON.stringify(bottlenecks)}
        
        Give me an operations report based on this data.`,
      schema: z.object({
        executive_summary: z.string().describe('A punchy, 2-sentence assessment of the current agency health based on the data.'),
        immediate_actions: z.array(z.string()).max(3).describe('Top 1 to 3 highly specific actions the agency owner must take right now to clear bottlenecks.'),
        capacity_warning: z.string().nullable().describe('If any editor is at or over capacity (5 tasks), or if all editors are empty, note it here. Otherwise return null.')
      }),
    });

    return NextResponse.json(result.object);
  } catch (error: any) {
    // THIS prints to your VS Code Terminal
    console.error('=== AI API CRASH DETAILS ===');
    console.error(error);
    
    return NextResponse.json({ 
      error: 'Failed to generate insights',
      details: error.message || "Unknown error occurred"
    }, { status: 500 });
  }
}