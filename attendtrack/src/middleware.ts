import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Kunin ang mga Office IPs mula sa Environment Variables sa Vercel
const OFFICE_IPS = (process.env.OFFICE_PUBLIC_IPS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function middleware(request: NextRequest) {
  // Kunin ang IP address ng bumibisita
  const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  
  // I-check kung ang IP ay kasama sa whitelist
  const isOffice = ip && OFFICE_IPS.includes(ip);

  // Huwag i-block kung nasa local development (localhost)
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  if (!isOffice) {
    // Path ng image base sa folder structure mo: attendtrack/public/assets/images/403error.png
    const imagePath = '/assets/images/403error.png';

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.tailwindcss.com"></script>
      <title>Access Denied | Hamdan Studio</title>
      <style>
        body { background-color: #0b0f1a; color: white; font-family: sans-serif; overflow: hidden; }
        .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .glow { box-shadow: 0 0 60px -15px rgba(59, 130, 246, 0.4); }
      </style>
    </head>
    <body class="flex items-center justify-center min-h-screen p-6">
      <div class="max-w-md w-full glass rounded-[2.5rem] p-10 text-center glow relative z-10">
        
        <!-- Image display -->
        <img 
          src="${imagePath}" 
          alt="403 Forbidden" 
          class="w-56 h-auto mx-auto mb-8 drop-shadow-2xl"
          onerror="this.style.display='none'"
        />

        <h1 class="text-3xl font-black tracking-tighter mb-3 uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
          Access Denied
        </h1>
        
        <p class="text-gray-400 text-sm leading-relaxed mb-8">
          This system is restricted. Please connect to the 
          <span class="text-blue-400 font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            Hamdan Studio Office Network
          </span> 
          to log your attendance.
        </p>

        <div class="bg-black/30 rounded-2xl p-5 mb-4 border border-white/5">
          <p class="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 font-bold text-center">Unauthorized IP Address</p>
          <div class="text-blue-300 font-mono text-xl text-center">${ip || 'Hidden'}</div>
        </div>

        <p class="text-[10px] text-gray-600 font-medium tracking-widest uppercase">
          System Administration • Hamdan Studio
        </p>
      </div>

      <!-- Ambient Background Glow -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-0"></div>
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
  // IMPORTANT: Kailangan kasama ang 'assets' sa exclusion list para lumabas ang image
  matcher: ['/((?!api|_next/static|_next/image|assets|favicon.ico).*)'],
};