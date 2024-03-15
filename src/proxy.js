const express = require('express');
const cors = require('cors');

const http = require('http');
const https = require('https');

const app = express();

app.use(cors());

app.all('/proxy', (req, res) => {
	const url = req.query['url'];

	if (!url) {
		return;
	}

	console.log('[proxy] forwarding: ' + url);

	const targetURL = new URL(url);

	const options = {
		hostname: targetURL.hostname,
		port: targetURL.port || (targetURL.protocol === 'https:' ? 443 : 80),
		path: targetURL.pathname + targetURL.search,
		method: req.method,
		headers: {
			...req.headers,
			host: 'game.aq.com',
			'user-agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
		},
	};

	console.log('[proxy]', options);

	const protocol = options.port === 443 ? https : http;

	const proxyReq = protocol.request(options, (proxyRes) => {
		res.writeHead(proxyRes.statusCode, proxyRes.headers);
		proxyRes.pipe(res, { end: true });
	});

	req.pipe(proxyReq, { end: true });
});

app.listen(3_000, console.log('[proxy] up on port 3000'));
