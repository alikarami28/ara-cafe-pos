// api/auth-status.js - Check auth configuration
export default function handler(req, res) {
  res.json({
    status: 'ok',
    configured: !!process.env.GITHUB_CLIENT_ID,
    site: 'ara-cafe-pos.vercel.app',
    endpoints: {
      auth: '/api/auth',
      callback: '/api/callback'
    }
  });
}
