import type { APIRoute } from "astro";
import companyData from "../../data/companies.json";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const company = url.searchParams.get("company")?.toLowerCase();
  const window = url.searchParams.get("window") || "all-time";

  const env = (locals as any).runtime?.env;
  const db = env?.DB;

  if (!company) {
    return new Response(JSON.stringify({
      supportedCompanies: ["meta", "google", "amazon", "microsoft", "bloomberg", "apple", "uber", "bytedance", "netflix"],
      lastFetched: (companyData as any)._meta?.lastFetched || "2026-08-30"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" }
    });
  }

  // If D1 is connected, query D1 SQL join
  if (db) {
    try {
      const query = `
        SELECT p.id, p.slug, p.title, p.difficulty, p.topics, p.is_paid_only, 
               cf.frequency_percent, cf.pattern, cf.priority
        FROM problems p
        JOIN company_frequencies cf ON p.id = cf.problem_id
        WHERE cf.company = ? AND cf.window = ?
        ORDER BY cf.frequency_percent DESC
      `;
      const { results } = await db.prepare(query).bind(company, window).all();
      return new Response(JSON.stringify({
        company,
        window,
        source: "d1",
        total: results.length,
        questions: results
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=86400, s-maxage=604800" }
      });
    } catch (e) {}
  }

  // Fallback to bundled dataset
  const cData = ((companyData as any).companies || companyData)[company];
  const list = cData?.[window] || cData?.["all-time"] || [];

  return new Response(JSON.stringify({
    company,
    window,
    source: "fallback",
    total: list.length,
    questions: list
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" }
  });
};
