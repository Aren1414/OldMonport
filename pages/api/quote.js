  export default async function handler(req, res) {
  const { query } = req;

  // Set CORS headers to allow cross-origin requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, 0x-api-key");

  // Handle preflight (OPTIONS) request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const params = new URLSearchParams(query).toString();

    const response = await fetch(`https://api.0x.org/swap/v1/quote?${params}`, {
      headers: {
        "0x-api-key": "ca1b360f-cde6-4073-9589-53438e781c22"
      }
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch quote",
      details: err.message,
    });
  }
}
