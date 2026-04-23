import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const  AGENT_APP_KEY = "cw_live_9f3aK8xP2mQ7vL4rT1zY6bN0dH5sW8eC";

  // if (!AGENT_API_BASE || !AGENT_APP_KEY) {
  //   return res
  //     .status(500)
  //     .json({ message: "Agent API configuration missing in .env" });
  // }

  if ( !AGENT_APP_KEY) {
    return res
      .status(500)
      .json({ message: "Agent API configuration missing in .env" });
  }

  const authHeader = req.headers.authorization;
  const agentType = req.body.agentType; // 'tutor' or 'customer-care'

  if (!agentType) {
    return res.status(400).json({ message: "agentType is required" });
  }

  // Ensure only allowed path fragments
  const allowedAgents = ["tutor", "customer-care"];
  if (!allowedAgents.includes(agentType)) {
    return res.status(400).json({ message: "Invalid agentType. Must be 'tutor' or 'customer-care'" });
  }

  // Remove agentType from payload forwarded to other service
  const { agentType: _unused, ...forwardPayload } = req.body;

  try {
    const response = await axios.post(
      `http://65.21.47.124:8002/chat/agent/${agentType}/`,
      forwardPayload,
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
    console.error("Agent Proxy error:", error.response?.data || error.message);
    return res
      .status(error.response?.status || 500)
      .json(
        error.response?.data || { message: "Failed to communicate with Agent API" }
      );
  }
}
