const fs = require("fs-extra");
const { logoFileForDomain, safeDomain } = require("../ui/profileData");

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
  const logoPath = domain ? await logoFileForDomain(domain) : null;

  if (!logoPath || !(await fs.pathExists(logoPath))) {
    response.status(404).send("Logo not found");
    return;
  }

  response.setHeader("Content-Type", await logoContentType(logoPath));
  response.setHeader("Cache-Control", "no-store");
  fs.createReadStream(logoPath).pipe(response);
};
