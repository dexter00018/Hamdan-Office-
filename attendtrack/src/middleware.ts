import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const OFFICE_IPS = (process.env.OFFICE_PUBLIC_IPS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function middleware(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim();

  const isOffice = ip && OFFICE_IPS.includes(ip);

  // Kung hindi taga-office, block agad lahat!
  if (!isOffice) {
    return new NextResponse(
      'Access Denied: You must be connected to Hamdan Studio Office Network.',
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};