import { createServer } from 'http';
import { initSocketServer } from './socket';

const PORT = Number(process.env.PORT) || 3001;
const HOST = '0.0.0.0';

// Minimal HTTP server so Render's health check and websocket upgrades have a host
const httpServer = createServer((req, res) => {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify({ status: 'ok', service: 'cloud-deck-socket' }));
});

initSocketServer(httpServer);

httpServer.listen(PORT, HOST, () => {
	console.log(`> Socket.IO server listening on ${HOST}:${PORT}`);
});
