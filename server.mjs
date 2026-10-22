import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const mimeTypes = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon" };
const rateLimit = new Map();

try {
  const envFile = await readFile(path.join(root, ".env"), "utf8");
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const key = process.env.WEATHER_API_KEY;

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  response.end(JSON.stringify(body));
}

function checkRateLimit(request) {
  const address = request.socket.remoteAddress || "unknown";
  const now = Date.now();
  const previous = rateLimit.get(address);
  if (!previous || now - previous.startedAt > 60_000) {
    rateLimit.set(address, { startedAt: now, count: 1 });
    return true;
  }
  previous.count += 1;
  return previous.count <= 30;
}

const server = createServer(async (request, response) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("X-Frame-Options", "DENY");
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (url.pathname === "/api/weather") {
    if (request.method !== "GET") return sendJson(response, 405, { error: "Bu istek desteklenmiyor." });
    if (!key) return sendJson(response, 503, { error: "Sunucu API anahtarı yapılandırılmamış. .env dosyasını kontrol et." });
    if (!checkRateLimit(request)) return sendJson(response, 429, { error: "Çok fazla arama yapıldı. Bir dakika sonra tekrar dene." });
    const city = (url.searchParams.get("city") || "").trim();
    if (!city || city.length > 100) return sendJson(response, 400, { error: "Geçerli bir şehir adı gir." });

    try {
      const params = new URLSearchParams({ key, q: city, days: "5", lang: "tr" });
      const upstream = await fetch(`https://api.weatherapi.com/v1/forecast.json?${params}`, { signal: AbortSignal.timeout(10_000) });
      const data = await upstream.json().catch(() => null);
      if (!upstream.ok) {
        const providerCode = data?.error?.code;
        if (providerCode === 1006) return sendJson(response, 404, { error: "Bu şehir bulunamadı. Yazımı kontrol edip tekrar dene." });
        if (providerCode === 1002 || providerCode === 2006 || providerCode === 2007) return sendJson(response, 503, { error: "Hava durumu servisi için API anahtarı geçersiz veya kullanım sınırına ulaşmış." });
        return sendJson(response, 502, { error: "Hava durumu servisi şu anda yanıt vermiyor. Biraz sonra tekrar dene." });
      }
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      response.end(JSON.stringify(data));
    } catch {
      sendJson(response, 502, { error: "Hava durumu servisine bağlanılamadı. Biraz sonra tekrar dene." });
    }
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    return response.end();
  }
  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  if (pathname.split("/").some((segment) => segment.startsWith("."))) {
    response.writeHead(404);
    return response.end("Not found");
  }
  const filePath = path.resolve(root, `.${pathname}`);
  if (!filePath.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403);
    return response.end("Forbidden");
  }
  try {
    const contents = await readFile(filePath);
    response.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream", "Cache-Control": "no-cache" });
    response.end(request.method === "HEAD" ? undefined : contents);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, () => console.log(`SkyCast hazır: http://localhost:${port}`));
