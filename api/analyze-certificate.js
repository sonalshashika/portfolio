const https = require('https');

function callGeminiAPI(apiKey, prompt, base64Image, mimeType) {
    return new Promise((resolve, reject) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

        const requestBody = JSON.stringify({
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: mimeType || 'image/jpeg',
                            data: cleanBase64
                        }
                    }
                ]
            }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const req = https.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error(`Failed to parse Gemini response: ${data}`));
                    }
                } else {
                    reject(new Error(`Gemini API Error: Status ${res.statusCode} - ${data}`));
                }
            });
        });

        req.on('error', err => reject(err));
        req.write(requestBody);
        req.end();
    });
}

function checkAuth(req) {
    const ADMIN_USER = process.env.ADMIN_USER || 'admin';
    const ADMIN_PASS = process.env.ADMIN_PASS;
    if (!ADMIN_PASS) return true; // Default to allow if not configured
    const authHeader = req.headers.authorization;
    if (!authHeader) return false;
    const [type, credentials] = authHeader.split(' ');
    if (type !== 'Basic') return false;
    const [username, password] = Buffer.from(credentials, 'base64').toString().split(':');
    return username === ADMIN_USER && password === ADMIN_PASS;
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    if (!checkAuth(req)) {
        res.status(401).json({ error: 'Unauthorized secure access' });
        return;
    }

    try {
        const { base64, mimeType } = req.body;
        if (!base64) {
            res.status(400).json({ error: 'Missing base64 data' });
            return;
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            res.status(400).json({ error: 'Gemini API key is not configured on Vercel' });
            return;
        }

        const prompt = "Analyze this certificate image. Identify the certificate title (name of course/certification), issuer (issuing organization), and the year of completion. Return a JSON object with fields: 'title' (string, max 60 chars), 'issuer' (string, max 40 chars), 'date' (string, 4-digit year).";
        
        const response = await callGeminiAPI(apiKey, prompt, base64, mimeType);
        
        let textResult = '';
        if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts[0]) {
            textResult = response.candidates[0].content.parts[0].text;
        }
        
        try {
            const parsedData = JSON.parse(textResult.trim());
            res.status(200).json(parsedData);
        } catch (e) {
            res.status(500).json({ error: 'Failed to parse Gemini response as JSON', response: textResult });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || 'Error occurred analyzing certificate' });
    }
};
