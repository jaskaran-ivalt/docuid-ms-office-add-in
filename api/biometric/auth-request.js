/**
 * Vercel serverless function — biometric auth request proxy.
 *
 * Forwards the request to DocuID backend and injects the API key
 * server-side from BIOMETRIC_API_KEY environment variable.
 * The key is never exposed to the browser.
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.BIOMETRIC_API_KEY;
  if (!apiKey) {
    console.error('[auth-request] BIOMETRIC_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const response = await fetch('https://www.docuid.net/api/biometric/auth-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json().catch(() => ({}));

    // Forward any session cookies the backend sets during the auth handshake so
    // the browser can persist them for the cookie-authenticated dashboard APIs.
    const setCookie =
      typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : response.headers.raw?.()['set-cookie'];
    if (setCookie && setCookie.length) {
      res.setHeader('Set-Cookie', setCookie);
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('[auth-request] Failed to reach DocuID backend:', error);
    return res.status(502).json({ error: 'Failed to reach authentication service' });
  }
};
