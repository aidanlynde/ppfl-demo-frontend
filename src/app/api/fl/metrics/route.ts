// src/app/api/fl/metrics/route.ts
import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export async function GET(request: Request) {
  try {
    // Get the session ID from the request headers
    const sessionId = request.headers.get('x-session-id');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_FL_API_URL}/api/fl/metrics`, {
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
    console.error('Error in metrics route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}