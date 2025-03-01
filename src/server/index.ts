import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocketServer } from './socket';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

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

  server.listen(Number(PORT), HOST, () => {
    console.log(`> Ready on http://${HOST}:${PORT}`);
  });
});