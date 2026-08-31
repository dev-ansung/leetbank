import type { APIRoute } from "astro";
import catalog from "../../../data/catalog.json";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Problem ID or slug required" }), { status: 400 });
  }

  const problem = !isNaN(Number(id))
    ? catalog.find(p => p.id === Number(id))
    : catalog.find(p => p.slug === id);

  if (!problem) {
    return new Response(JSON.stringify({ error: "Problem not found" }), { status: 404 });
  }

  return new Response(JSON.stringify({
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    difficulty: problem.difficulty,
    topics: problem.topics,
    isPaidOnly: problem.isPaidOnly || false,
    starterCode: {
      python3: `class Solution:\n    def solve(self):\n        pass`,
      typescript: `function solve() {}`
    },
    testCases: []
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400, s-maxage=604800"
    }
  });
};
