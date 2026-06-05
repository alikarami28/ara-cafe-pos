// api/auth.js - Vercel Serverless Function
export default async function handler(req, res) {
    const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, SITE_URL } = process.env;
    
    // آدرس GitHub OAuth
    const githubAuthUrl = 'https://github.com/login/oauth/authorize';
    const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        scope: 'repo,user',
        redirect_uri: `${SITE_URL}/api/callback`,
        state: Math.random().toString(36).substring(7)
    });
    
    // Redirect کاربر به GitHub
    res.writeHead(302, {
        Location: `${githubAuthUrl}?${params.toString()}`
    });
    res.end();
}