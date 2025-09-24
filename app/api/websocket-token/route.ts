import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Generate a simple token for websocket authentication
    const token = generateWebSocketToken();
    
    return NextResponse.json({ 
      token,
      expiresIn: 3600 // 1 hour
    });
  } catch (error) {
    console.error('Failed to generate websocket token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}

function generateWebSocketToken(): string {
  // Simple token generation - in production, use JWT or similar
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `ws_${timestamp}_${random}`;
}