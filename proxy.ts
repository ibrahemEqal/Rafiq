import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

function needsAuthRefresh(pathname: string) {
  const localizedPath = pathname.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
  return ["/dashboard", "/profile", "/resources/new", "/books/new", "/questions/new", "/requests/new"]
    .some((path) => localizedPath === path || localizedPath.startsWith(`${path}/`));
}

export async function proxy(request: NextRequest) {
  const response = intlMiddleware(request);
  // Public pages must not wait for an Auth round-trip. Protected pages still
  // refresh/verify the cookie before rendering; mutations verify again inside
  // their Server Actions.
  if (!needsAuthRefresh(request.nextUrl.pathname)) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/", "/(ar|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
