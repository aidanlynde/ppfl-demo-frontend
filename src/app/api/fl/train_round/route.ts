// src/app/api/fl/train_round/route.ts
import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';
import SessionStore from '@/lib/sessionStore';

export async function POST() {
  try {
    const sessionId = SessionStore.getSessionId();
    if (!sessionId) {
      throw new Error('No active session');
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/api/fl/train_round`, {
      method: 'POST',
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
    console.error('Error training round:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to train round' },
      { status: 500 }
    );
  }
}