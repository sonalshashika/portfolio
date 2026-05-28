module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    try {
        const { username, password } = req.body;
        const ADMIN_USER = process.env.ADMIN_USER || 'admin';
        const ADMIN_PASS = process.env.ADMIN_PASS;

        // If ADMIN_PASS environment variable is not configured, deny by default or advise configuring
        if (!ADMIN_PASS) {
            res.status(500).json({ error: 'ADMIN_PASS environment variable is not configured on Vercel. Please set it in your Vercel Dashboard.' });
            return;
        }

        if (username !== ADMIN_USER || password !== ADMIN_PASS) {
            res.status(401).json({ error: 'Invalid admin credentials' });
            return;
        }

        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message || 'Authentication error' });
    }
};
