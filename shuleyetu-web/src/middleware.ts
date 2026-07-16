import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { normalizeSupabaseUrl } from "@/lib/supabaseEnv";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser().catch((error) => {
    console.error("Middleware auth check failed", error);
    return { data: { user: null } };
  });

  const { pathname } = request.nextUrl;

  if (!user) {
    if (pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/auth/vendor-login", request.url));
    }
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    if (pathname.startsWith("/schools/portal")) {
      return NextResponse.redirect(new URL("/auth/school-login", request.url));
    }
    if (pathname.startsWith("/workspaces")) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/schools/portal/:path*",
    "/workspaces/:path*",
  ],
};
