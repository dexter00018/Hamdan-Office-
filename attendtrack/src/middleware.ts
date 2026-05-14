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
    // Path base sa folder structure mo: public/assets/images/403error.png
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
        body { 
          background-color: #0b0f1a; 
          color: white; 
          font-family: sans-serif; 
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          min-h-screen: 100vh;
        }
        /* Background Ambient Effect */
        .bg-glow {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(11, 15, 26, 0) 70%);
          z-index: -1;
        }
        .card-container {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 40px;
          padding: 50px;
          text-align: center;
          box-shadow: 0 0 80px -20px rgba(0, 0, 0, 0.5);
          width: 100%;
          max-width: 500px;
        }
      </style>
    </head>
    <body class="min-h-screen">
      <div class="bg-glow"></div>
      
      <div class="card-container glow">
        <!-- Full Image Highlight -->
        <div class="mb-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl">
          <img 
            src="${imagePath}" 
            alt="Access Denied Visual" 
            class="w-full h-auto object-cover"
            onerror="this.parentElement.style.display='none'"
          />
        </div>

        <h1 class="text-4xl font-black tracking-tighter mb-4 uppercase italic italic italic bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
          Access Denied
        </h1>
        
        <p class="text-gray-400 text-sm leading-relaxed mb-10 px-2">
          This system is restricted. Please connect to the 
          <span class="text-blue-400 font-bold">Hamdan Studio Office Network</span> 
          to log your attendance.
        </p>

        <div class="bg-black/40 rounded-2xl p-6 mb-8 border border-white/5">
          <p class="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2 font-bold text-center">Unauthorized IP Address</p>
          <div class="text-blue-300 font-mono text-2xl tracking-widest text-center">${ip || '77.111.247.25'}</div>
        </div>

        <p class="text-[11px] text-gray-600 font-bold tracking-[0.2em] uppercase">
          System Administration • Hamdan Studio
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
  // Siguraduhin na ang 'assets' ay nandito para ma-load ang full image
  matcher: ['/((?!api|_next/static|_next/image|assets|favicon.ico).*)'],
};