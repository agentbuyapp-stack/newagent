import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes - нэвтрэлгүйгээр орох боломжтой
const isPublicRoute = createRouteMatcher([
  "/",
  "/about",
  "/faq",
  "/help",
  "/privacy",
  "/terms",
  "/tutorial",
  "/login",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // Public route биш бол auth шалгах
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
