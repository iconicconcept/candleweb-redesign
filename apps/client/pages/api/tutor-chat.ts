import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { AGENT_API_BASE, AGENT_APP_KEY } = process.env;

  if (!AGENT_API_BASE || !AGENT_APP_KEY) {
    return res
      .status(500)
      .json({ message: "Agent API configuration missing in .env" });
  }

  const authHeader = req.headers.authorization;

  try {
    const response = await axios.post(
      `${AGENT_API_BASE}/chat/agent/tutor/`,
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
          "X-App-Key": AGENT_APP_KEY,
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      }
    );

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error("Proxy error:", error.response?.data || error.message);
    return res
      .status(error.response?.status || 500)
      .json(
        error.response?.data || { message: "Failed to communicate with Agent API" }
      );
  }
}
