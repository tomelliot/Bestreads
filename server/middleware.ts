import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    response.headers.set("Access-Control-Allow-Headers", "*");
    return response;
  }
  const response = NextResponse.next({
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });

  // Allow this page to be embedded in iframes from any origin
  // This is necessary when hosting in an iframe on a different domain
  // Note: We don't set X-Frame-Options since it would conflict with CSP frame-ancestors
  // The CSP frame-ancestors directive allows embedding from any origin
  response.headers.set("Content-Security-Policy", "frame-ancestors *;");

  return response;
}

export const config = {
  matcher: "/:path*",
};
