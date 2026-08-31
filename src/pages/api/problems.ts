import type { APIRoute } from "astro";
import { handleGetProblems } from "../../lib/api-handlers";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  return handleGetProblems(request);
};
