// npm install axios

const http = require('http');
const url = require('url');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const OPENAI_API_KEY = 'Add your OPENAI_API_KEY here.';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const LOG_FILE_PATH = path.join(__dirname, 'log.txt');

const logToConsole = (text) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${text}\n`);
};

const logToFile = (text) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${text}\n`;

    fs.appendFile(LOG_FILE_PATH, logEntry, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
};

const logConversationToFile = (request, response) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] User: ${request}\n[${timestamp}] Assistant: ${response}\n\n`;

    fs.appendFile(LOG_FILE_PATH, logEntry, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
};


logToFile('Server starting...');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    const pathName = parsedUrl.pathname;
    let found = false;

    if (req.method === 'GET' && pathName.startsWith('/content')) {
        found = true;
        const filePath = path.join(__dirname, req.url);
        fs.access(filePath, fs.constants.R_OK, (err) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File Not Found');
                logToConsole(`Server received a request on ${pathName} and returned: 404 File Not Found.`);
                logToFile(`Server received a request on ${pathName} and returned: 404 File Not Found.`);
                return;
            }

            const extname = path.extname(filePath);
            let contentType = 'text/plain';

            switch (extname) {
                case '.html':
                    contentType = 'text/html';
                    break;
                case '.js':
                    contentType = 'text/javascript';
                    break;
                case '.css':
                    contentType = 'text/css';
                    break;
                case '.json':
                    contentType = 'application/json';
                    break;
                case '.png':
                    contentType = 'image/png';
                    break;
            }

            fs.readFile(filePath, (err, content) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                    logToConsole(`Server received a request on ${pathName} and returned: 500 Internal Server Error.`);
                    logToFile(`Server received a request on ${pathName} and returned: 404 Internal Server Error.`);
                    return;
                }

                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
                logToConsole(`Server received a request on ${pathName} and returned ${contentType}.`);
            });
        });

    }

    if (req.method === 'POST' && pathName === '/conversation') {
        found = true;
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const jsonData = JSON.parse(body);
                const assistantPrompt = "You are a helpful assistant who makes jokes.";
                const userMessage = jsonData.request;

                axios.post(OPENAI_API_URL, {
                    model: "gpt-4o-mini",
                    messages: [{ "role": "assistant", "content": assistantPrompt }, { "role": "user", "content": userMessage }],
                    temperature: 1.2
                }, {
                    headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                })
                    .then(response => {
                        const aiResponse = response.data.choices[0].message.content.trim();
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ response: aiResponse }));
                        logConversationToFile(userMessage, aiResponse);
                    })
                    .catch(error => {
                        console.error('Error calling OpenAI API:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        logToFile(`Server received a request on ${pathName} and returned: 500 Internal Server Error.`);
                    });
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
                logToFile(`Server received a request on ${pathName} and returned: 400 Invalid JSON.`);
            }
        });
    }

    if (!found){
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Route Not Found' }));
        logToFile(`Server received a request on ${pathName} and returned: 404 Route Not Found.`);
    }
});

const PORT = process.env.PORT || 80;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
