import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocketServer } from './socket';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.RENDER_EXTERNAL_HOSTNAME || '0.0.0.0';

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

    server.listen(PORT, HOST, () => {
        console.log(`> Server running in ${dev ? 'development' : 'production'} mode`);
        console.log(`> Ready on http://${HOST}:${PORT}`);
    }).on('error', (err) => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });

    // Graceful shutdown
    const shutdown = () => {
        console.log('Received termination signal. Closing server...');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}).catch(err => {
    console.error('Error during Next.js initialization:', err);
    process.exit(1);
});