import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "torus-prediction-swarm-dashboard",
    },
    { status: 200 },
  );
}
