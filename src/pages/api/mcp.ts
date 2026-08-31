import type { APIRoute } from "astro";
import { handleMcpToolCall, MCP_TOOLS } from "../../lib/mcp";

export const prerender = false;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-mcp-version",
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
};

export const GET: APIRoute = async ({ request }) => {
  const acceptHeader = request.headers.get("accept") || "";

  // If client requests SSE stream
  if (acceptHeader.includes("text/event-stream")) {
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(
          encoder.encode(
            `event: endpoint\ndata: ${JSON.stringify({ endpoint: "/api/mcp", version: "2024-11-05" })}\n\n`,
          ),
        );
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Otherwise return MCP manifest and available tools discovery
  return new Response(
    JSON.stringify({
      name: "leetbank-mcp",
      version: "1.0.0",
      description: "Remote Edge Model Context Protocol (MCP) server for LeetBank",
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {
          listChanged: false,
        },
      },
      tools: MCP_TOOLS,
    }),
    {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      },
    },
  );
};

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error: Invalid JSON" },
      }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  const { jsonrpc, id, method, params } = body;

  if (jsonrpc !== "2.0") {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: id ?? null,
        error: { code: -32600, message: "Invalid Request: jsonrpc must be '2.0'" },
      }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  try {
    switch (method) {
      case "initialize":
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: {
                tools: {
                  listChanged: false,
                },
              },
              serverInfo: {
                name: "leetbank-mcp",
                version: "1.0.0",
              },
            },
          }),
          { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
        );

      case "notifications/initialized":
      case "initialized":
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id: id ?? null,
            result: {},
          }),
          { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
        );

      case "ping":
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: {},
          }),
          { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
        );

      case "tools/list":
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: {
              tools: MCP_TOOLS,
            },
          }),
          { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
        );

      case "tools/call": {
        const { name, arguments: toolArgs = {} } = params || {};
        if (!name) {
          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: "Missing tool name in params" },
            }),
            { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
          );
        }

        const result = await handleMcpToolCall(name, toolArgs);
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            result,
          }),
          { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
        );
      }

      default:
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Method not found: ${method}` },
          }),
          { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
        );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: id ?? null,
        error: {
          code: -32603,
          message: err.message || "Internal MCP error",
        },
      }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
};
