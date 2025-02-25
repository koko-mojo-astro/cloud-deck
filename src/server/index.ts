import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocketServer } from './socket';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

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

    server.listen(3000, () => {
        console.log('> Ready on http://localhost:3000');
    });
});