async function readJsonBody(request) {
  if (Buffer.isBuffer(request.body)) {
    const rawBody = request.body.toString("utf8");
    return rawBody ? JSON.parse(rawBody) : {};
  }

  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  if (typeof request.body === "string") {
    return request.body ? JSON.parse(request.body) : {};
  }

  const chunks = [];

  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");

  return rawBody ? JSON.parse(rawBody) : {};
}

module.exports = {
  readJsonBody,
};
