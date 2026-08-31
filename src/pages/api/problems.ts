import type { APIRoute } from "astro";
import catalog from "../../data/catalog.json";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const difficulty = url.searchParams.get("difficulty");
  const topic = url.searchParams.get("topic");
  const q = url.searchParams.get("q")?.toLowerCase();
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  let list = catalog;

  if (difficulty && difficulty !== "All") {
    list = list.filter(p => p.difficulty.toLowerCase() === difficulty.toLowerCase());
  }

  if (topic) {
    list = list.filter(p => p.topics.some(t => t.toLowerCase() === topic.toLowerCase()));
  }

  if (q) {
    list = list.filter(p => 
      p.id.toString() === q ||
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q)
    );
  }

  const paginated = list.slice(offset, offset + limit);

  return new Response(JSON.stringify({
    total: list.length,
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
};
