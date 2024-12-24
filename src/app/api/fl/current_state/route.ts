// src/app/api/fl/current_state/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const sessionId = request.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_FL_API_URL}/api/fl/current_state`, {
      headers: {
        'X-Session-ID': sessionId
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching current state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current state' },
      { status: 500 }
    );
  }
}