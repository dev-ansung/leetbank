import { CatalogService } from "./catalog";
import { ProblemFetcher } from "./fetcher";

export async function handleGetProblems(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const difficulty = url.searchParams.get("difficulty") || undefined;
  const topic = url.searchParams.get("topic") || undefined;
  const search = url.searchParams.get("q") || undefined;
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  const filtered = CatalogService.search({ difficulty, topic, search });
  const paginated = filtered.slice(offset, offset + limit);

  return new Response(JSON.stringify({
    total: filtered.length,
    offset,
    limit,
    problems: paginated
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600"
    }
  });
}

export async function handleGetProblemDetail(req: Request, idOrSlug: string): Promise<Response> {
  try {
    const problem = await ProblemFetcher.fetchProblem(idOrSlug);
    return new Response(JSON.stringify(problem), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400, s-maxage=604800"
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Failed to fetch problem" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
