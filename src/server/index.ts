import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocketServer } from './socket';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        // Check if the request is for Socket.IO
        if (parsedUrl.pathname?.startsWith('/socket.io')) {
            // Let Socket.IO handle its own routing
            res.statusCode = 200;
            return;
        }
        // Otherwise, let Next.js handle the request
        handle(req, res, parsedUrl);
    });

    const io = initSocketServer(server);

    server.listen(PORT, HOST, () => {
        console.log(`> Ready on http://${HOST}:${PORT}`);
    }).on('error', (err) => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });
});