import { NextRequest, NextResponse } from 'next/server';
import Csrf from 'csrf';

const csrf = new Csrf();
const CSRF_SECRET = process.env.CSRF_SECRET;
if (!CSRF_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("CSRF_SECRET environment variable must be set in production");
}
const effectiveSecret = CSRF_SECRET || "dev-only-csrf-secret-not-for-production";

export async function generateCSRFToken(): Promise<string> {
  return csrf.create(effectiveSecret);
}

export async function verifyCSRFToken(token: string): Promise<boolean> {
  try {
    return csrf.verify(effectiveSecret, token);
  } catch (error) {
    console.error('CSRF verification failed:', error);
    return false;
  }
}

export async function withCSRFProtection(
  request: NextRequest
): Promise<NextResponse | null> {
  // Skip CSRF check for GET requests
  if (request.method === 'GET') {
    return null;
  }

  // Skip CSRF check for health check
  if (request.nextUrl.pathname === '/api/health') {
    return null;
  }

  try {
    const body = await request.clone().json().catch(() => ({}));
    const token = body._csrf || request.headers.get('x-csrf-token');

    if (!token) {
      return NextResponse.json(
        { error: 'CSRF token missing' },
        { status: 403 }
      );
    }

    const isValid = await verifyCSRFToken(token);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    return null;
  } catch (error) {
    console.error('CSRF protection error:', error);
    return NextResponse.json(
      { error: 'CSRF protection error' },
      { status: 500 }
    );
  }
}
