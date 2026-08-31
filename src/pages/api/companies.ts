import type { APIRoute } from "astro";
import companyData from "../../data/companies.json";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const company = url.searchParams.get("company")?.toLowerCase();
  const window = url.searchParams.get("window") || "all-time";

  if (!company) {
    return new Response(JSON.stringify({
      supportedCompanies: Object.keys(companyData)
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400"
      }
    });
  }

  const cData = (companyData as any)[company];
  if (!cData) {
    return new Response(JSON.stringify({ error: "Company not found", questions: [] }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  const questions = cData[window] || cData["all-time"] || [];

  return new Response(JSON.stringify({
    company,
    window,
    total: questions.length,
    questions
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400, s-maxage=604800"
    }
  });
};
