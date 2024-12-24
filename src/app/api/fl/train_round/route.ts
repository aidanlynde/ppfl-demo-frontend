// src/app/api/fl/train_round/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const sessionId = request.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_FL_API_URL}/api/fl/train_round`, {
      method: 'POST',
      headers: {
        'X-Session-ID': sessionId
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Training round error:', errorText);
      throw new Error('Failed to train round');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in train round route:', error);
    return NextResponse.json(
      { error: 'Failed to train round' },
      { status: 500 }
    );
  }
}