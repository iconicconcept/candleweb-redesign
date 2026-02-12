// pages/api/update-json.ts
import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type Data = {
  success: boolean;
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === "POST") {
    try {
      const dataToAppend = req.body;
      const filePath = path.join(process.cwd(), "info", "candle_info.json");
      const fileContent = fs.readFileSync(filePath, "utf8");
      const jsonData = JSON.parse(fileContent);

      jsonData.push(dataToAppend);
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

      res
        .status(200)
        .json({ success: true, message: "Data appended successfully." });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  } else {
    res.status(405).json({ success: false, message: "Method Not Allowed" });
  }
}
