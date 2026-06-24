const { signInWithPassword } = require("../src/ui/supabaseStore");
const { readJsonBody } = require("../src/ui/readJsonBody");

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { email, password } = await readJsonBody(request);
    const session = await signInWithPassword(email, password);
    response.status(200).json(session);
  } catch (error) {
    response.status(401).json({ error: error.message });
  }
};
