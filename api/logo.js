const fs = require("fs-extra");
const path = require("path");
const { logoPathForDomain, safeDomain } = require("../src/ui/profileData");

async function logoContentType(filePath) {
  const head = (await fs.readFile(filePath)).subarray(0, 128).toString("utf8").trimStart();

  return head.startsWith("<svg") || head.startsWith("<?xml") ? "image/svg+xml" : "image/png";
}

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).send("Method not allowed");
    return;
  }

  const domain = safeDomain(request.query.domain);
  const outputLogoPath = domain ? logoPathForDomain(domain) : null;
  const publicLogoPath = domain
    ? path.join(process.cwd(), "public", "logos", domain, "logo.png")
    : null;
  const logoPath = outputLogoPath && (await fs.pathExists(outputLogoPath))
    ? outputLogoPath
    : publicLogoPath;

  if (!logoPath || !(await fs.pathExists(logoPath))) {
    response.status(404).send("Logo not found");
    return;
  }

  response.setHeader("Content-Type", await logoContentType(logoPath));
  response.setHeader("Cache-Control", "no-store");
  fs.createReadStream(logoPath).pipe(response);
};
