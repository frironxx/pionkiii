import { Request, Response } from 'express';
import axios from 'axios';

export async function handleStreamProxy(req: Request, res: Response) {
  const targetUrl = req.query.url as string;

  if (!targetUrl) {
    res.status(400).send('Brak wymaganego parametru URL');
    return;
  }

  try {
    const rangeHeader = req.headers.range;

    const requestHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      Referer: 'https://www.tiktok.com/',
      Accept: '*/*',
    };

    if (rangeHeader) {
      requestHeaders['Range'] = rangeHeader;
    }

    const response = await axios({
      method: 'GET',
      url: targetUrl,
      headers: requestHeaders,
      responseType: 'stream',
      validateStatus: () => true, // Przepuszczaj 200 i 206
      timeout: 15000,
    });

    res.status(response.status);

    // Kopiuj kluczowe nagłówki strumieniowania
    const headersToForward = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control',
    ];

    headersToForward.forEach((h) => {
      const val = response.headers[h];
      if (val) {
        res.setHeader(h, val);
      }
    });

    // Ustaw nagłówki CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

    response.data.pipe(res);
  } catch (err: any) {
    console.error('[StreamProxy] Błąd strumieniowania:', err?.message || err);
    if (!res.headersSent) {
      res.status(502).send('Błąd pobierania strumienia wideo z TikToka');
    }
  }
}
