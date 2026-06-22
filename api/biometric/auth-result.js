/**
 * Vercel serverless function — biometric auth result proxy.
 *
 * Forwards the polling request to DocuID backend and injects the API key
 * server-side from BIOMETRIC_API_KEY environment variable.
 * The key is never exposed to the browser.
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.BIOMETRIC_API_KEY;
  if (!apiKey) {
    console.error('[auth-result] BIOMETRIC_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const response = await fetch('https://www.docuid.net/api/biometric/auth-result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('[auth-result] Failed to reach DocuID backend:', error);
    return res.status(502).json({ error: 'Failed to reach authentication service' });
  }
};
