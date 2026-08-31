import type { APIRoute } from "astro";
import { ProblemFetcher } from "../../../lib/fetcher";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Problem ID or slug required" }), { status: 400 });
  }

  try {
    const problem = await ProblemFetcher.fetchProblem(id);
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
};
