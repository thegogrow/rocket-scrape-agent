const fs = require("fs-extra");
const http = require("http");
const net = require("net");
const path = require("path");
const { listProfiles, loadProfile, logoPathForDomain, safeDomain } = require("./profileData");

const START_PORT = Number.parseInt(process.env.PROFILE_UI_PORT || "3001", 10);
const PUBLIC_DIR = path.resolve(process.cwd(), "public");

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload, null, 2));
}

function sendText(response, statusCode, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function contentTypeFor(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

async function handleStatic(requestPath, response) {
  const relativePath = requestPath === "/" ? "index.html" : requestPath.slice(1);
  const staticPath = path.resolve(PUBLIC_DIR, relativePath);

  if (!staticPath.startsWith(PUBLIC_DIR) || !(await fs.pathExists(staticPath))) {
    sendText(response, 404, "Not found");
    return;
  }

  const body = await fs.readFile(staticPath);
  response.writeHead(200, {
    "Content-Type": contentTypeFor(staticPath),
    "Cache-Control": "no-store",
  });
  response.end(body);
}

async function handleRequest(request, response) {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const requestPath = requestUrl.pathname;

    if (requestPath === "/api/profiles") {
      const profiles = await listProfiles();
      sendJson(response, 200, profiles);
      return;
    }

    const profileMatch = requestPath.match(/^\/api\/profiles\/([^/]+)$/);

    if (profileMatch) {
      const domain = safeDomain(profileMatch[1]);

      if (!domain) {
        sendJson(response, 400, { error: "Invalid domain" });
        return;
      }

      sendJson(response, 200, await loadProfile(domain));
      return;
    }

    const logoMatch = requestPath.match(/^\/logos\/([^/]+)\/logo\.png$/);

    if (logoMatch) {
      const domain = safeDomain(logoMatch[1]);
      const logoPath = domain ? logoPathForDomain(domain) : null;

      if (!logoPath || !(await fs.pathExists(logoPath))) {
        sendText(response, 404, "Logo not found");
        return;
      }

      response.writeHead(200, {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      });
      fs.createReadStream(logoPath).pipe(response);
      return;
    }

    await handleStatic(requestPath, response);
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

function canListen(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();

    probe.once("error", () => {
      resolve(false);
    });

    probe.once("listening", () => {
      probe.close(() => {
        resolve(true);
      });
    });

    probe.listen(port);
  });
}

async function findOpenPort(startPort) {
  for (let port = startPort; port <= startPort + 20; port += 1) {
    if (await canListen(port)) {
      return port;
    }
  }

  throw new Error(`No open port found from ${startPort} to ${startPort + 20}`);
}

async function start() {
  const port = await findOpenPort(START_PORT);
  const server = http.createServer((request, response) => {
    handleRequest(request, response);
  });

  server.listen(port, () => {
    console.log(`Profile UI running at http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error(`Failed to start profile UI: ${error.message}`);
  process.exitCode = 1;
});
