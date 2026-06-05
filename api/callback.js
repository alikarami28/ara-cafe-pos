// api/callback.js - GitHub OAuth Callback
export default async function handler(req, res) {
  const { code } = req.query;
  
  if (!code) {
    res.status(400).send('Error: No code provided');
    return;
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID || 'Ov23liBd90dQnJVWZtK1',
        client_secret: process.env.GITHUB_CLIENT_SECRET || 'your-secret-here',
        code: code
      })
    });

    const data = await response.json();

    if (data.access_token) {
      // Redirect به CMS با token
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>در حال ورود...</title>
          <script>
            const tokenData = ${JSON.stringify(data)};
            window.opener.postMessage({
              type: 'authorization',
              provider: 'github',
              token: tokenData.access_token
            }, '*');
            setTimeout(() => window.close(), 2000);
          </script>
          <style>
            body {
              font-family: Tahoma, sans-serif;
              background: #3E2723;
              color: white;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              text-align: center;
              direction: rtl;
            }
          </style>
        </head>
        <body>
          <div>
            <h1>✅ احراز هویت موفق!</h1>
            <p>در حال انتقال به پنل مدیریت...</p>
          </div>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);
    } else {
      res.status(400).send('Authentication failed: ' + JSON.stringify(data));
    }
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
}
