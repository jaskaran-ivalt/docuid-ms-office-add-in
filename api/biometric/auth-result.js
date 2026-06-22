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

    // Forward the backend's session cookies (token, refreshToken) to the browser.
    // Auth is cookie-based: the dashboard/documents APIs are authenticated by the
    // HttpOnly `token` cookie on `.docuid.net`. Without forwarding Set-Cookie here
    // the browser never stores it and every subsequent API call returns 401.
    const setCookie =
      typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : response.headers.raw?.()['set-cookie'];
    if (setCookie && setCookie.length) {
      res.setHeader('Set-Cookie', setCookie);
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('[auth-result] Failed to reach DocuID backend:', error);
    return res.status(502).json({ error: 'Failed to reach authentication service' });
  }
};
