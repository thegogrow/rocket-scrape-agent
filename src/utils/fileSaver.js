const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { env } = require("../config/env");

const IMAGE_RETRY_COUNT = 2;
const IMAGE_RETRY_DELAY_MS = 1000;

function getCompanyOutputDir(domain) {
  return path.join(env.paths.outputDir, domain);
}

async function saveJson(domain, filename, data) {
  const outputDir = getCompanyOutputDir(domain);
  const outputPath = path.join(outputDir, filename);

  await fs.ensureDir(outputDir);
  await fs.writeJson(outputPath, data, { spaces: 2 });

  return outputPath;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function bufferLooksLikeImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
    return false;
  }

  const asciiStart = buffer.toString("utf8", 0, Math.min(buffer.length, 256)).trimStart();

  if (asciiStart.startsWith("<svg") || asciiStart.startsWith("<?xml")) {
    return true;
  }

  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return true;
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return true;
  }

  if (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00) {
    return true;
  }

  if (buffer.toString("ascii", 0, 4) === "GIF8") {
    return true;
  }

  return false;
}

async function saveImage(domain, imageUrl, filename = "logo.png") {
  if (typeof imageUrl !== "string" || imageUrl.trim() === "") {
    return null;
  }

  const outputDir = getCompanyOutputDir(domain);
  const outputPath = path.join(outputDir, filename);
  let lastError = null;

  for (let attempt = 1; attempt <= IMAGE_RETRY_COUNT; attempt += 1) {
    try {
      const response = await axios.get(imageUrl.trim(), {
        responseType: "arraybuffer",
        timeout: 30000,
        maxRedirects: 5,
        headers: {
          "User-Agent": "rocket-scrape-agent",
          Accept: "image/*,*/*;q=0.8",
        },
        validateStatus(status) {
          return status >= 200 && status < 300;
        },
      });

      const contentType = String(response.headers["content-type"] || "").toLowerCase();
      const imageBuffer = Buffer.from(response.data);
      const validContentType =
        contentType.startsWith("image/") || contentType === "application/octet-stream";

      if (!validContentType || !bufferLooksLikeImage(imageBuffer)) {
        throw new Error(`Invalid image content-type: ${contentType || "unknown"}`);
      }

      await fs.ensureDir(outputDir);
      await fs.writeFile(outputPath, imageBuffer);

      return outputPath;
    } catch (error) {
      lastError = error;

      if (attempt < IMAGE_RETRY_COUNT) {
        await sleep(IMAGE_RETRY_DELAY_MS);
      }
    }
  }

  throw lastError;
}

module.exports = {
  saveJson,
  saveImage,
};
