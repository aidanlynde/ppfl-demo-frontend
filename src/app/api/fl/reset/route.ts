// app/api/fl/reset/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id');
    const apiUrl = process.env.NEXT_PUBLIC_FL_API_URL;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      );
    }

    // Notice the URL pattern matches your other endpoints
    const response = await fetch(`${apiUrl}/api/fl/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId
      }
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
    
  } catch (error) {
    console.error('Error in reset route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}