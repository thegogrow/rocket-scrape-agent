const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

function getEnv(name, options = {}) {
  const { defaultValue, required = false, trim = true } = options;
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue === null || rawValue === "") {
    if (required) {
      throw new Error(`Missing required environment variable: ${name}`);
    }

    return defaultValue;
  }

  return trim ? rawValue.trim() : rawValue;
}

function getRequiredEnv(name, options = {}) {
  return getEnv(name, { ...options, required: true });
}

const env = Object.freeze({
  nodeEnv: getEnv("NODE_ENV", { defaultValue: "development" }),
  firecrawl: {
    apiKey: getEnv("FIRECRAWL_API_KEY"),
    baseUrl: getEnv("FIRECRAWL_BASE_URL", {
      defaultValue: "https://api.firecrawl.dev/v2",
    }),
  },
  openRouter: {
    apiKey: getEnv("OPENROUTER_API_KEY"),
    baseUrl: getEnv("OPENROUTER_BASE_URL", {
      defaultValue: "https://openrouter.ai/api/v1",
    }),
    model: getEnv("OPENROUTER_MODEL", {
      defaultValue: "anthropic/claude-sonnet-4",
    }),
  },
  github: {
    token: getEnv("GITHUB_TOKEN"),
  },
  apollo: {
    apiKey: getEnv("APOLLO_API_KEY"),
    baseUrl: getEnv("APOLLO_BASE_URL", {
      defaultValue: "https://api.apollo.io",
    }),
  },
  brandfetch: {
    apiKey: getEnv("BRANDFETCH_API_KEY"),
    baseUrl: getEnv("BRANDFETCH_BASE_URL", {
      defaultValue: "https://api.brandfetch.io",
    }),
  },
  paths: {
    rootDir: process.cwd(),
    outputDir: path.resolve(
      process.cwd(),
      getEnv("OUTPUT_DIR", { defaultValue: "output" })
    ),
    dataDir: path.resolve(
      process.cwd(),
      getEnv("DATA_DIR", { defaultValue: "data" })
    ),
  },
});

module.exports = {
  env,
  getEnv,
  getRequiredEnv,
};
