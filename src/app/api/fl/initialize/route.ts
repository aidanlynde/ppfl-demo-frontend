// src/app/api/fl/initialize/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Get session ID from headers
    const sessionId = request.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      );
    }

    console.log('Initializing with session:', sessionId);

    // Forward the request to your FastAPI backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_FL_API_URL}/api/fl/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId
      },
      body: await request.text() // Forward the original request body
    });

    if (!response.ok) {
      console.error('FastAPI error:', await response.text());
      throw new Error(`FastAPI responded with status ${response.status}`);
    }

    const data = await response.json();
    console.log('Initialize response:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in initialize route:', error);
    return NextResponse.json(
      { error: 'Failed to initialize training' },
      { status: 500 }
    );
  }
}