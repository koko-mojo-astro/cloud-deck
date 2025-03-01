import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocketServer } from './socket';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Update port and host configuration for Render
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0'; // This allows connections from all network interfaces

app.prepare().then(() => {
  const server = createServer((req, res) => {
    if (!req.url) {
      res.statusCode = 400;
      res.end('Bad Request: Missing URL');
      return;
    }
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl).catch(err => {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    });
  });

  const io = initSocketServer(server);

    server.listen(PORT, HOST, () => {
        console.log(`> Server listening on ${HOST}:${PORT}`);
  });
});