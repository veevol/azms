import type { IncomingMessage, ServerResponse } from "node:http";
import { tangani } from "./mcp";

export default async function nodeTangani(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  const host = req.headers.host || "localhost";
  const proto = (req.headers["x-forwarded-proto"] as string) || (host.includes("localhost") ? "http" : "https");
  let body: Buffer | undefined;
  if (req.body !== undefined && req.method !== "GET" && req.method !== "HEAD") {
    body = Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body));
  } else if (req.method !== "GET" && req.method !== "HEAD") {
    const potong: Buffer[] = [];
    for await (const bagian of req) potong.push(bagian as Buffer);
    const gabung = Buffer.concat(potong);
    if (gabung.length) body = gabung;
  }
  const headers = new Headers();
  for (const [kunci, nilai] of Object.entries(req.headers)) {
    if (typeof nilai === "string") headers.set(kunci, nilai);
    else if (Array.isArray(nilai)) headers.set(kunci, nilai.join(", "));
  }
  const request = new Request(`${proto}://${host}${req.url}`, {
    method: req.method,
    headers,
    body: body ? new Uint8Array(body) : undefined,
  });
  const response = await tangani(request);
  res.statusCode = response.status;
  response.headers.forEach((nilai, kunci) => res.setHeader(kunci, nilai));
  res.end(Buffer.from(await response.arrayBuffer()));
}
