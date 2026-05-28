const https = require('https');
const fs = require('fs');
const path = require('path');

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

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    try {
        const { message } = req.body;
        if (!message) {
            res.status(400).json({ error: 'Missing message' });
            return;
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            res.status(200).json({ response: "I'd love to chat, but Sonal's Gemini API Key is not configured on Vercel yet. Set the GEMINI_API_KEY environment variable in your Vercel Dashboard!" });
            return;
        }

        let portfolioData = {};
        try {
            portfolioData = require('../data.json');
        } catch(e){
            console.error('Failed to load data.json:', e);
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
        
        res.status(200).json({ response: textResult.trim() });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || 'Error occurred during AI chat' });
    }
};
