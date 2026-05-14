import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const OFFICE_IPS = (process.env.OFFICE_PUBLIC_IPS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function middleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const isOffice = ip && OFFICE_IPS.includes(ip);

  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  if (!isOffice) {
    // Siguraduhin na ang "image_a379b7.png" ay nasa loob ng iyong /public/assets/images/ folder
    const imagePath = '/assets/images/image_a379b7.png';

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Access Denied</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, html { 
          height: 100%; 
          width: 100%; 
          overflow: hidden; 
          background-color: #0b0f1a; 
        }
        .bg-fullscreen {
          background-image: url("${imagePath}");
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover; /* Eto ang magpapa-full screen sa image */
          height: 100vh;
          width: 100vw;
        }
      </style>
    </head>
    <body>
      <div class="bg-fullscreen"></div>
    </body>
    </html>
    `;

    return new NextResponse(html, {
      status: 403,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|assets|favicon.ico).*)'],
};