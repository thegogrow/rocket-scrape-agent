const fs = require("fs-extra");
const { logoPathForDomain, safeDomain } = require("../src/ui/profileData");

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).send("Method not allowed");
    return;
  }

  const domain = safeDomain(request.query.domain);
  const logoPath = domain ? logoPathForDomain(domain) : null;

  if (!logoPath || !(await fs.pathExists(logoPath))) {
    response.status(404).send("Logo not found");
    return;
  }

  response.setHeader("Content-Type", "image/png");
  response.setHeader("Cache-Control", "no-store");
  fs.createReadStream(logoPath).pipe(response);
};
