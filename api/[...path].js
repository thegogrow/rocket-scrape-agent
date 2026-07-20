const { apiHandlerForPath, apiQueryForPath } = require("../src/api/router");

module.exports = async function handler(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const apiHandler = apiHandlerForPath(requestUrl.pathname);

  if (!apiHandler) {
    response.status(404).json({ error: "API route not found" });
    return;
  }

  request.query = {
    ...(request.query || {}),
    ...apiQueryForPath(requestUrl.pathname, requestUrl.searchParams),
  };

  await apiHandler(request, response);
};
