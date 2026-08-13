const { refreshAdminSession, statusForError } = require("../ui/supabaseStore");
const { readJsonBody } = require("../ui/readJsonBody");

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { refreshToken } = await readJsonBody(request);
    const session = await refreshAdminSession(refreshToken);

    response.status(200).json(session);
  } catch (error) {
    response.status(statusForError(error)).json({ error: error.message });
  }
};
