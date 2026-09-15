import { NextResponse } from "next/server";
import faultsData from "@/data/triage_faults.json";

export async function GET() {
  const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
  try {
    const res = await fetch(`${backendUrl}/api/triage/faults`, {
      cache: "no-store",
      signal: AbortSignal.timeout(1200),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Standalone fallback
  }

  return NextResponse.json(faultsData);
}
