export default async function handler(req, res) {
  const { query } = req;
  try {
    const params = new URLSearchParams(query);
    const response = await fetch(`https://api.0x.org/swap/v1/quote?${params}`, {
      headers: {
        "0x-api-key": "ca1b360f-cde6-4073-9589-53438e781c22"
      }
    });
    const data = await response.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch quote", details: err.message });
  }
}
