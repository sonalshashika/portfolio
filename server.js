const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 8000;
const DATA_FILE = path.join(__dirname, 'data.json');
const ENV_FILE = path.join(__dirname, '.env');

let envVars = {};
if (fs.existsSync(ENV_FILE)) {
    const envContent = fs.readFileSync(ENV_FILE, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            envVars[match[1]] = match[2];
        }
    });
} else {
    const randomPass = crypto.randomBytes(8).toString('hex');
    fs.writeFileSync(ENV_FILE, `ADMIN_USER=admin\nADMIN_PASS=${randomPass}\n`);
    envVars['ADMIN_USER'] = 'admin';
    envVars['ADMIN_PASS'] = randomPass;
    console.log(`\n=========================================`);
    console.log(`Generated new admin credentials in .env file:`);
    console.log(`Username: admin`);
    console.log(`Password: ${randomPass}`);
    console.log(`=========================================\n`);
}

let ADMIN_USER = process.env.ADMIN_USER || envVars.ADMIN_USER || 'admin';
let ADMIN_PASS = process.env.ADMIN_PASS || envVars.ADMIN_PASS;

function checkAuth(req) {
    if (!ADMIN_PASS) return false;
    const authHeader = req.headers.authorization;
    if (!authHeader) return false;
    const [type, credentials] = authHeader.split(' ');
    if (type !== 'Basic') return false;
    const [username, password] = Buffer.from(credentials, 'base64').toString().split(':');
    return username === ADMIN_USER && password === ADMIN_PASS;
}

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

function callGeminiTextAPI(apiKey, prompt) {
    return new Promise((resolve, reject) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const requestBody = JSON.stringify({
            contents: [{
                parts: [
                    { text: prompt }
                ]
            }]
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

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    let safeUrl = req.url === '/' ? '/index.html' : req.url;
    safeUrl = safeUrl.split('?')[0];
    const normalizedPath = path.normalize(safeUrl).replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/');

    const isAdminRoute = normalizedPath.startsWith('/admin');
    const isPostApi = (
        normalizedPath === '/api/content' || 
        normalizedPath === '/api/upload' || 
        normalizedPath === '/api/settings' || 
        normalizedPath === '/api/settings/ai' || 
        normalizedPath === '/api/analyze-certificate'
    ) && req.method === 'POST';
    
    const isGetSettings = normalizedPath === '/api/settings/ai' && req.method === 'GET';
    
    if (isAdminRoute || isPostApi || isGetSettings) {
        if (!checkAuth(req)) {
            res.writeHead(401, {
                'WWW-Authenticate': 'Basic realm="Control Panel"',
                'Content-Type': 'text/plain'
            });
            res.end('Authentication required');
            return;
        }
    }

    if (normalizedPath === '/api/content') {
        if (req.method === 'GET') {
            fs.readFile(DATA_FILE, 'utf8', (err, data) => {
                if (err) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({}));
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(data);
                }
            });
            return;
        }

        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                try {
                    JSON.parse(body);
                    fs.writeFile(DATA_FILE, body, 'utf8', (err) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Failed to save data' }));
                        } else {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: true }));
                        }
                    });
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid JSON data' }));
                }
            });
            return;
        }
    }

    if (normalizedPath === '/api/upload' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                const { filename, base64 } = payload;
                if (!filename || !base64) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing filename or base64 data' }));
                    return;
                }

                const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                let fileBuffer;
                if (matches && matches.length === 3) {
                    fileBuffer = Buffer.from(matches[2], 'base64');
                } else {
                    fileBuffer = Buffer.from(base64, 'base64');
                }

                const imagesDir = path.join(__dirname, 'images');
                const certsDir = path.join(imagesDir, 'certificates');
                if (!fs.existsSync(imagesDir)) {
                    fs.mkdirSync(imagesDir);
                }
                if (!fs.existsSync(certsDir)) {
                    fs.mkdirSync(certsDir);
                }

                let relativePath;
                if (filename === 'profile.png' || filename === 'profile.jpg' || filename === 'profile.jpeg') {
                    relativePath = 'images/profile.png';
                } else {
                    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
                    relativePath = `images/certificates/${Date.now()}_${safeName}`;
                }

                const absolutePath = path.join(__dirname, relativePath);
                fs.writeFile(absolutePath, fileBuffer, (err) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to write file' }));
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, url: relativePath }));
                    }
                });
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON data' }));
            }
        });
        return;
    }

    if (normalizedPath === '/api/settings/ai') {
        if (req.method === 'GET') {
            const key = process.env.GEMINI_API_KEY || envVars.GEMINI_API_KEY || '';
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ hasKey: !!key }));
            return;
        }
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                try {
                    const payload = JSON.parse(body);
                    const { geminiApiKey } = payload;
                    
                    let envContent = '';
                    if (fs.existsSync(ENV_FILE)) {
                        envContent = fs.readFileSync(ENV_FILE, 'utf8');
                    }
                    
                    if (envContent.includes('GEMINI_API_KEY=')) {
                        envContent = envContent.replace(/GEMINI_API_KEY=.*/, `GEMINI_API_KEY=${geminiApiKey}`);
                    } else {
                        envContent += `\nGEMINI_API_KEY=${geminiApiKey}\n`;
                    }
                    
                    fs.writeFileSync(ENV_FILE, envContent, 'utf8');
                    envVars.GEMINI_API_KEY = geminiApiKey;
                    process.env.GEMINI_API_KEY = geminiApiKey;

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid payload' }));
                }
            });
            return;
        }
    }

    if (normalizedPath === '/api/analyze-certificate' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const payload = JSON.parse(body);
                const { base64, mimeType } = payload;
                if (!base64) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing base64 data' }));
                    return;
                }

                const apiKey = process.env.GEMINI_API_KEY || envVars.GEMINI_API_KEY;
                if (!apiKey) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Gemini API key is not configured on the server' }));
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
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(parsedData));
                } catch (e) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Failed to parse Gemini response as JSON', response: textResult }));
                }
            } catch (e) {
                console.error(e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message || 'Error occurred analyzing certificate' }));
            }
        });
        return;
    }

    if (normalizedPath === '/api/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const payload = JSON.parse(body);
                const { message } = payload;
                if (!message) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing message' }));
                    return;
                }

                const apiKey = process.env.GEMINI_API_KEY || envVars.GEMINI_API_KEY;
                if (!apiKey) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ response: "I'd love to chat, but Sonal's Gemini API Key is not configured on this server yet. Ask him to set it up in the admin Settings panel!" }));
                    return;
                }

                let portfolioData = {};
                if (fs.existsSync(DATA_FILE)) {
                    try {
                        portfolioData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
                    } catch(e){}
                }

                const systemPrompt = `You are "Nexus AI Core", Sonal Jayawardana's digital clone & recruiter agent. Answer questions about Sonal's skills, qualifications, work history, projects, and certificates.

Sonal's Portfolio Data Context:
${JSON.stringify(portfolioData, null, 2)}

Rules:
1. Speak in the third person or as Sonal's advanced AI companion. Keep the tone professional and friendly.
2. Answer based ONLY on Sonal's dataset above. If the dataset does not contain the answer, state that you don't have that specific record, but suggest contacting Sonal directly at sonalshashika@gmail.com.
3. Keep answers concise: 1 to 3 sentences maximum. Use standard plaintext, no markdown tables, keep it compact since it is viewed in a raw retro terminal window.`;

                const response = await callGeminiTextAPI(apiKey, `${systemPrompt}\n\nUser Question: ${message}`);
                
                let textResult = '';
                if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts[0]) {
                    textResult = response.candidates[0].content.parts[0].text;
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ response: textResult.trim() }));
            } catch (e) {
                console.error(e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message || 'Error occurred during AI chat' }));
            }
        });
        return;
    }

    if (normalizedPath === '/api/settings' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                const { username, password } = payload;
                if (!username || !password) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing username or password' }));
                    return;
                }

                fs.writeFile(ENV_FILE, `ADMIN_USER=${username}\nADMIN_PASS=${password}\n`, 'utf8', (err) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to save settings' }));
                    } else {
                        ADMIN_USER = username;
                        ADMIN_PASS = password;
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    }
                });
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON data' }));
            }
        });
        return;
    }

    let filePath = path.join(__dirname, normalizedPath);
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const extname = path.extname(filePath).toLowerCase();
    let contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
});
