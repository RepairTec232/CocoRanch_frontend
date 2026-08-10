import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express, { Request, Response, NextFunction } from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';
import validator from 'validator';

export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();
  
  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  if(process.env['NODE_ENV'] === 'production') {
    server.set('trust proxy', true);
  }


  server.get('**', express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
  }));

  server.get('**', secureHeaders, (req, res) => {
    const { protocol, originalUrl, baseUrl, headers } = req;
    const sanitizedProtocol = validator.escape(protocol);
    const sanitizedHost = validator.escape(headers.host || '');
    const sanitizedOriginalUrl = validator.escape(originalUrl);
    const sanitizedBaseUrl = validator.escape(baseUrl);
    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${sanitizedProtocol}://${sanitizedHost}${sanitizedOriginalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: sanitizedBaseUrl }],
      })
      .then((html) => res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload").send(html))
      .catch((_err) => res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload").status(500).send('Internal Server Error'));
  });

  return server;
}

function secureHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self';"
  );
  next();
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
