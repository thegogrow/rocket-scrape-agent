const fs = require("fs-extra");
const http = require("http");
const net = require("net");
const path = require("path");
const { listProfiles, loadProfile, logoPathForDomain, safeDomain } = require("./profileData");
const { isSupabaseConfigured, listPublishedProviders } = require("./supabaseStore");

const START_PORT = Number.parseInt(process.env.PROFILE_UI_PORT || "3001", 10);
const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const API_HANDLERS = {
  "/api/admin-login": require("../../api/admin-login"),
  "/api/admin-publish": require("../../api/admin-publish"),
  "/api/admin-provider": require("../../api/admin-provider"),
  "/api/admin-scrape": require("../../api/admin-scrape"),
  "/api/admin-state": require("../../api/admin-state"),
  "/api/logo": require("../../api/logo"),
};

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

function createApiResponse(response) {
  let statusCode = 200;
  const headers = {};

  function writeHeaders(contentType) {
    if (response.headersSent) {
      return;
    }

    response.writeHead(statusCode, {
      ...(contentType ? { "Content-Type": contentType } : {}),
      "Cache-Control": "no-store",
      ...headers,
    });
  }

  return {
    setHeader(name, value) {
      headers[name] = value;
    },
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      writeHeaders("application/json; charset=utf-8");
      response.end(JSON.stringify(payload, null, 2));
    },
    send(body) {
      writeHeaders(typeof body === "string" ? "text/plain; charset=utf-8" : "application/octet-stream");
      response.end(body);
    },
    write(chunk) {
      writeHeaders();
      return response.write(chunk);
    },
    end(chunk) {
      writeHeaders();
      return response.end(chunk);
    },
    on(...args) {
      response.on(...args);
      return this;
    },
    once(...args) {
      response.once(...args);
      return this;
    },
    removeListener(...args) {
      response.removeListener(...args);
      return this;
    },
    off(...args) {
      response.off(...args);
      return this;
    },
    emit(...args) {
      return response.emit(...args);
    },
  };
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
  const relativePath = requestPath === "/" ? "index.html" : requestPath === "/admin" ? "admin.html" : requestPath.slice(1);
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
    const apiHandler = API_HANDLERS[requestPath];

    if (apiHandler) {
      request.query = Object.fromEntries(requestUrl.searchParams.entries());
      await apiHandler(request, createApiResponse(response));
      return;
    }

    if (requestPath === "/api/profiles") {
      let profiles = [];

      if (isSupabaseConfigured()) {
        profiles = await listPublishedProviders();
      }

      if (profiles.length === 0) {
        profiles = await listProfiles();
      }

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
