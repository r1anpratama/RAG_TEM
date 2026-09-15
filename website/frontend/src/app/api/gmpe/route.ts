import { NextRequest, NextResponse } from "next/server";

function computeTaiwanCrustalGmpePgv(mw: number, distanceKm: number, vs30: number = 760.0) {
  const rRup = Math.max(1.0, distanceKm);
  const c1 = 1.25;
  const c2 = 0.85;
  const c3 = 1.35;
  const c4 = 4.5;
  const c5 = 0.22;
  const sigmaLn = 0.58;
  const fType = 0.22;
  const fSite = 0.35 * Math.log(760.0 / Math.max(180.0, vs30));
  const lnPgv = c1 + (c2 * mw) - (c3 * Math.log(rRup + c4 * Math.exp(c5 * mw))) + fType + fSite;
  const medianPgv = Math.exp(lnPgv);
  return {
    median_pgv: Math.round(medianPgv * 100) / 100,
    sigma_ln: sigmaLn,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const magnitude = parseFloat(searchParams.get("magnitude") || "6.91");
  const vs30 = parseFloat(searchParams.get("vs30") || "760.0");

  const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
  try {
    const res = await fetch(`${backendUrl}/api/gmpe?magnitude=${magnitude}&vs30=${vs30}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(1200),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Standalone fallback calculation
  }

  const distances = [1, 2, 5, 10, 15, 20, 30, 40, 50, 75, 100];
  const points = distances.map((d) => {
    const est = computeTaiwanCrustalGmpePgv(magnitude, d, vs30);
    const med = est.median_pgv;
    const sig = est.sigma_ln;
    return {
      distance_km: d,
      median_pgv: med,
      upper_2sigma: Math.round(med * Math.exp(2.0 * sig) * 100) / 100,
      lower_2sigma: Math.round(med * Math.exp(-2.0 * sig) * 100) / 100,
    };
  });

  return NextResponse.json({
    model: "TEM PSHA2025: Lin & Lee (2008) Taiwan Crustal GMPE",
    magnitude,
    vs30_m_s: vs30,
    curve: points,
  });
}
