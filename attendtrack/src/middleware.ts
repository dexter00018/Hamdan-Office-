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
    // Ang path ay base sa: public -> asset -> image -> 403error.png
    const imagePath = '/asset/image/403error.png'; 

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.tailwindcss.com"></script>
      <title>Access Denied | Hamdan Studio</title>
      <style>
        body { background-color: #0b0f1a; color: white; font-family: sans-serif; }
        .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .glow { box-shadow: 0 0 50px -12px rgba(59, 130, 246, 0.5); }
      </style>
    </head>
    <body class="flex items-center justify-center min-h-screen p-6">
      <div class="max-w-md w-full glass rounded-[2.5rem] p-10 text-center glow">
        
        <img 
          src="${imagePath}" 
          alt="403 Forbidden" 
          class="w-56 h-auto mx-auto mb-8 drop-shadow-2xl"
          onerror="this.src='https://cdn-icons-png.flaticon.com/512/752/752755.png'"
        />

        <h1 class="text-3xl font-black tracking-tighter mb-3 uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
          Access Denied
        </h1>
        
        <p class="text-gray-400 text-sm leading-relaxed mb-8">
          This system is restricted. Please connect to the 
          <span class="text-blue-400 font-bold">Hamdan Studio Office Network</span> 
          to log your attendance.
        </p>

        <div class="bg-black/30 rounded-2xl p-5 mb-4 border border-white/5">
          <p class="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 font-bold">Unauthorized IP Address</p>
          <code class="text-blue-300 font-mono text-xl">${ip || 'Hidden'}</code>
        </div>

        <p class="text-[10px] text-gray-600 font-medium">
          SYSTEM ADMINISTRATION • HAMDAN STUDIO
        </p>
      </div>
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
  // Siguraduhin na HINDI kasama ang 'asset' sa negative lookahead 
  // para ma-load pa rin ang image kahit blocked ang user.
  matcher: ['/((?!api|_next/static|_next/image|asset|favicon.ico).*)'],
};