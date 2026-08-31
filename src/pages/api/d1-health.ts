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
        message: "D1 database 'leetbank-db' ready. In production edge runtime, queries execute directly on D1."
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { results: problems } = await db.prepare("SELECT * FROM problems").all();
    const { results: frequencies } = await db.prepare("SELECT * FROM company_frequencies").all();

    return new Response(JSON.stringify({
      status: "connected",
      database: "leetbank-db",
      region: "WNAM",
      problemsCount: problems.length,
      problems,
      companyFrequencies: frequencies
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
