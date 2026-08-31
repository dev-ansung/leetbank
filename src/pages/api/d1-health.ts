import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.DB;

    if (!db) {
      return new Response(JSON.stringify({
        status: "ok",
        mode: "local_preview",
        message: "D1 database ready. In production edge runtime, queries execute directly on D1."
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { results: countProbs } = await db.prepare("SELECT COUNT(*) as count FROM problems").all();
    const { results: countFreqs } = await db.prepare("SELECT COUNT(*) as count FROM company_frequencies").all();
    const { results: sampleProbs } = await db.prepare("SELECT id, slug, title, difficulty, is_paid_only FROM problems LIMIT 5").all();

    return new Response(JSON.stringify({
      status: "connected",
      database: "leetbank-db",
      region: "WNAM",
      totalProblemsInD1: countProbs[0]?.count,
      totalCompanyRecordsInD1: countFreqs[0]?.count,
      sampleProblems: sampleProbs
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
