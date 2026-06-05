// api/auth.js - GitHub OAuth Redirect
export default function handler(req, res) {
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Ov23liBd90dQnJVWZtK1';
  
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    scope: 'repo,user',
    redirect_uri: 'https://ara-cafe-pos.vercel.app/api/callback',
    state: Math.random().toString(36).substring(7)
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
}
