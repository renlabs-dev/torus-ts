/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { getAuthConfig } from "~/utils/auth-config";
import NextAuth from "next-auth";
import type { NextRequest } from "next/server";

// Create a wrapper that handles the initialization lazily
let handler: any = null;

function getHandler() {
  if (!handler) {
    handler = NextAuth(getAuthConfig());
  }
  return handler;
}

// Export functions that use the lazy-initialized handler
export function GET(req: NextRequest, context: any) {
  return getHandler()(req, context);
}

export function POST(req: NextRequest, context: any) {
  return getHandler()(req, context);
}