// api/callback.js - Vercel Serverless Function
export default async function handler(req, res) {
    const { code } = req.query;
    const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;
    
    if (!code) {
        res.status(400).json({ error: 'No code provided' });
        return;
    }
    
    try {
        // دریافت access token از GitHub
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code: code
            })
        });
        
        const tokenData = await tokenResponse.json();
        
        if (tokenData.error) {
            throw new Error(tokenData.error_description || 'Token exchange failed');
        }
        
        // ارسال token به صفحه admin
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authentication Successful</title>
                <script>
                    (function() {
                        function receiveMessage(e) {
                            window.opener.postMessage(
                                'authorization:github:success:${JSON.stringify({
                                    token: tokenData.access_token,
                                    provider: 'github'
                                })}',
                                e.origin
                            );
                            window.close();
                        }
                        
                        window.addEventListener('message', receiveMessage, false);
                        window.opener.postMessage('authorizing:github', '*');
                        
                        // Fallback: بستن پنجره بعد از ۲ ثانیه
                        setTimeout(() => {
                            window.close();
                        }, 2000);
                    })();
                </script>
                <style>
                    body {
                        font-family: 'Segoe UI', sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background: #3E2723;
                        color: white;
                        text-align: center;
                        direction: rtl;
                    }
                    .success {
                        padding: 40px;
                    }
                    .checkmark {
                        font-size: 4rem;
                        display: block;
                        margin-bottom: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="success">
                    <span class="checkmark">✅</span>
                    <h1>احراز هویت موفق!</h1>
                    <p>در حال انتقال به پنل مدیریت...</p>
                </div>
            </body>
            </html>
        `;
        
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(html);
        
    } catch (error) {
        res.status(500).json({ 
            error: 'Authentication failed',
            details: error.message 
        });
    }
}