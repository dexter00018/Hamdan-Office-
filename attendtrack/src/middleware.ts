import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Kunin ang mga allowed IPs mula sa Environment Variables
const OFFICE_IPS = (process.env.OFFICE_PUBLIC_IPS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function isOfficeRequest(request: NextRequest): boolean {
  // Kunin ang IP ng user mula sa Vercel headers
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim();
  
  if (!ip) return false;
  if (OFFICE_IPS.length === 0) return false;
  
  return OFFICE_IPS.includes(ip);
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;

  // 1. HOME PAGE ONLY: Ito na lang ang pwedeng makita ng publiko/labas.
  const isPublicPage = pathname === '/';

  // 2. OFFICE CHECK: Kung taga-office, payagan sa KAHIT ANONG page.
  if (isOfficeRequest(request)) {
    return NextResponse.next();
  }

  // 3. OUTSIDE CHECK: Kung nasa labas at sinusubukang buksan ang Admin o ibang pages.
  if (!isPublicPage) {
    // I-block ang access at magpakita ng error message.
    return new NextResponse(
      `Access Denied: Ang page na ito (${pathname}) ay para sa Office Network lamang.`,
      { status: 403 }
    );
  }

  // Payagan ang request kung ito ay ang Home Page (Public).
  return NextResponse.next();
}

export const config = {
  // Protektahan ang lahat ng routes maliban sa mga static files (images, css, etc.)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};