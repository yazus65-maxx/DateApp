export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { location, datetime, dishes } = req.body;

  if (!location || !datetime || !dishes) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;

  if (!googleScriptUrl) {
    console.error("GOOGLE_SCRIPT_URL is not set in environment variables");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const response = await fetch(googleScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        location,
        datetime,
        dishes,
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Script responded with ${response.status}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Failed to forward response to Google Sheets:", error);
    return res.status(500).json({ error: "Failed to save response" });
  }
}
