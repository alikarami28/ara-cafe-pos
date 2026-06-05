// api/auth-status.js - بررسی وضعیت احراز هویت
export default async function handler(req, res) {
    const { GITHUB_CLIENT_ID } = process.env;
    
    res.json({
        status: 'configured',
        provider: 'github',
        client_id: GITHUB_CLIENT_ID ? '✓' : '✗',
        ready: !!GITHUB_CLIENT_ID
    });
}