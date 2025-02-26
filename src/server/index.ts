import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocketServer } from './socket';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

app.prepare().then(() => {
    const server = createServer((req, res) => {
        if (!req.url) {
            res.statusCode = 400;
            res.end('Bad Request: Missing URL');
            return;
        }
        const parsedUrl = parse(req.url, true);
        // Enhanced Socket.IO routing
        if (parsedUrl.pathname?.startsWith('/socket.io')) {
            res.statusCode = 200;
            return;
        }
        // Handle Next.js requests
        handle(req, res, parsedUrl).catch(err => {
            console.error('Error handling request:', err);
            res.statusCode = 500;
            res.end('Internal Server Error');
        });
    });

    const io = initSocketServer(server);

    server.listen(10000, () => {
        console.log('> Ready on port 10000');
    });
});