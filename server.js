const http = require('http');
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
    const isPostApi = (normalizedPath === '/api/content' || normalizedPath === '/api/upload' || normalizedPath === '/api/settings') && req.method === 'POST';
    if (isAdminRoute || isPostApi) {
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
