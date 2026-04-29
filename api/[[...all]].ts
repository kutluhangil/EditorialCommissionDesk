import app from "./boot";
import type { IncomingMessage, ServerResponse } from "http";

function nodeHeadersToFetchHeaders(
  nodeHeaders: Record<string, string | string[] | undefined>
) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(nodeHeaders)) {
    if (!value) continue;
    if (Array.isArray(value)) headers.set(key, value.join(","));
    else headers.set(key, value);
  }
  return headers;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host || "localhost";
    const url = `${protocol}://${host}${req.url}`;

    const headers = nodeHeadersToFetchHeaders(req.headers || {});

    const getBody = async () => {
      return new Promise<Uint8Array>((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        req.on("data", (c: Uint8Array) => chunks.push(c));
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
      });
    };

    const rawBody = await getBody();
    const fetchReq = new Request(url, {
      method: req.method,
      headers,
      body: rawBody.length ? rawBody : undefined,
    });

    const response = await app.fetch(fetchReq as Request);

    res.statusCode = response.status;
    response.headers.forEach((v, k) => res.setHeader(k, v));
    const buf = Buffer.from(await response.arrayBuffer());
    res.end(buf);
  } catch (err) {
    console.error("API wrapper error:", err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
}
