// src/app/api/fl/current_state/route.ts
import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';
import SessionStore from '@/lib/sessionStore';

export async function GET() {
  try {
    const sessionId = SessionStore.getSessionId();
    if (!sessionId) {
      throw new Error('No active session');
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/api/fl/current_state`, {
      headers: {
        'X-Session-ID': sessionId,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching current state:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch current state' },
      { status: 500 }
    );
  }
}