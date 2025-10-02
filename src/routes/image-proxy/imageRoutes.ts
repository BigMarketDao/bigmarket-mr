import express, { Request, Response } from 'express';
import { Readable } from 'stream';

const router = express.Router();

router.get('/proxy', async (req: Request, res: Response) => {
	const url = req.query.url as string;
	if (!url || url.indexOf('https://') !== 0) res.status(400).send('missing url');

	// OPTIONAL: whitelist hosts to avoid open proxy abuse
	const allowedHosts = ['pump.fun', 'images.pump.fun', 'cdn.pump.fun'];
	try {
		const u = new URL(url);
		if (!allowedHosts.includes(u.hostname)) res.status(403).send('host not allowed');

		const upstream = await fetch(url, { redirect: 'follow' });
		if (!upstream.ok) res.status(upstream.status).send('upstream error');

		// Stream response, but set permissive CORS and caching headers
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
		res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/*');

		if (upstream.body) {
			const nodeStream = Readable.fromWeb(upstream.body as any);
			nodeStream.pipe(res);
		} else {
			res.status(500).send('no body from upstream');
		}
	} catch (err) {
		console.error(err);
		res.status(500).send('proxy error');
	}
});

export { router as imageRoutes };
