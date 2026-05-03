import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import type { ServerResponse } from "node:http";
import { extname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist-demo");
const preferredPort = Number(process.env["PORT"] ?? 4173);

const contentTypes: Readonly<Record<string, string>> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

function sendFile(path: string, response: ServerResponse): void {
  const extension = extname(path);
  response.setHeader(
    "content-type",
    contentTypes[extension] ?? "application/octet-stream",
  );
  createReadStream(path).pipe(response);
}

function listen(port: number): void {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
    const pathname = decodeURIComponent(url.pathname);
    const safePath = pathname === "/" ? "/index.html" : pathname;
    const filePath = resolve(join(dist, safePath));

    if (!filePath.startsWith(dist)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      sendFile(filePath, response);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });

  server.once("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE" && port < preferredPort + 20) {
      listen(port + 1);
      return;
    }

    throw error;
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(`Solid UI demo: http://127.0.0.1:${port}`);
  });
}

listen(preferredPort);
