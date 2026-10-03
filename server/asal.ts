export function asal(request: Request) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost";
  const lokal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const proto = lokal ? "http" : request.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

export function cors(asalTeks: string): HeadersInit {
  return {
    "access-control-allow-origin": asalTeks === "null" ? "*" : "*",
    "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
    "access-control-allow-headers": "authorization, content-type, mcp-protocol-version",
    "access-control-expose-headers": "www-authenticate",
  };
}

export function json(body: unknown, status = 200, extra?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...extra },
  });
}
