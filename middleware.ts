import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  // Protect admin dashboard
  if (pathname.startsWith("/dashboard")) {
    if (!isLoggedIn || role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Protect member area
  if (pathname.startsWith("/member")) {
    if (!isLoggedIn || role !== "member") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Redirect logged-in users away from login
  if (pathname === "/login" && isLoggedIn) {
    const redirectTo = role === "admin" ? "/dashboard" : "/member";
    return NextResponse.redirect(new URL(redirectTo, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
