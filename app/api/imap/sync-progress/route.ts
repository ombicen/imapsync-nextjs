import { NextRequest, NextResponse } from "next/server";

// This is a placeholder file for static export compatibility
// The actual progress tracking will be handled directly in the sync API

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Progress tracking is handled directly in the sync API for static export compatibility"
  });
}
