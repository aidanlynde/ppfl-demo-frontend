// src/app/api/fl/initialize/route.ts
import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface InitializeData {
  num_clients: number;
  local_epochs: number;
  batch_size: number;
  noise_multiplier: number;
  l2_norm_clip: number;
}

export async function POST(request: Request) {
  try {
    const sessionId = request.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      );
    }

    const data: InitializeData = await request.json();
    console.log('Initializing with data:', data);

    // Add timeout to the fetch request using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout for initialization

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_FL_API_URL}/api/fl/initialize`, {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || await response.text() || 'Unknown error';
        console.error('Initialization failed:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return NextResponse.json(result);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Initialization timed out' },
          { status: 504 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in initialize route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to initialize training',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}