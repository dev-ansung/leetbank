import type { APIRoute } from "astro";
import { ProblemFetcher } from "../../../lib/fetcher";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Problem ID or slug required" }), { status: 400 });
  }

  const env = (locals as any).runtime?.env;
  const db = env?.DB;

  // 1. Check D1 Edge Cache
  if (db) {
    try {
      const isNum = !Number.isNaN(Number(id));
      const query = isNum ? "SELECT * FROM problems WHERE id = ?" : "SELECT * FROM problems WHERE slug = ?";
      const param = isNum ? Number(id) : id;

      const { results } = await db.prepare(query).bind(param).all();
      const cached = results[0] as any;

      if (cached?.description_html && cached.starter_code_json) {
        return new Response(
          JSON.stringify({
            id: cached.id,
            slug: cached.slug,
            title: cached.title,
            difficulty: cached.difficulty,
            topics: cached.topics ? cached.topics.split(", ") : [],
            isPaidOnly: !!cached.is_paid_only,
            descriptionHtml: cached.description_html,
            starterCode: JSON.parse(cached.starter_code_json),
            solutions: cached.solutions_json ? JSON.parse(cached.solutions_json) : [],
            testCases: cached.test_cases_json ? JSON.parse(cached.test_cases_json) : [],
            hints: cached.hints_json ? JSON.parse(cached.hints_json) : [],
            source: "d1_cache",
            cachedAt: cached.cached_at,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=604800, s-maxage=2592000",
            },
          },
        );
      }
    } catch (_e) {}
  }

  // 2. Cache-Miss: Fetch from live dual-source engine
  try {
    const problem = await ProblemFetcher.fetchProblem(id);

    // 3. Write-back to D1 asynchronously
    if (db && problem.descriptionHtml) {
      try {
        await db
          .prepare(`
          UPDATE problems 
          SET description_html = ?, starter_code_json = ?, solutions_json = ?, test_cases_json = ?, hints_json = ?, cached_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
          .bind(
            problem.descriptionHtml,
            JSON.stringify(problem.starterCode),
            JSON.stringify(problem.solutions),
            JSON.stringify(problem.testCases),
            JSON.stringify(problem.hints),
            problem.id,
          )
          .run();
      } catch (_e) {}
    }

    return new Response(JSON.stringify(problem), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Failed to fetch problem" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
