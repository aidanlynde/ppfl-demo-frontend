// src/app/api/fl/current_state/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const sessionId = request.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_FL_API_URL}/api/fl/current_state`, {
        headers: {
          'X-Session-ID': sessionId,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Current state error:', errorText);
        return NextResponse.json(
          { error: `Failed to fetch current state: ${errorText}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timed out' },
          { status: 504 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in current state route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch current state' },
      { status: 500 }
    );
  }
}