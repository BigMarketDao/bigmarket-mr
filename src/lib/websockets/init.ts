import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';

let wss: WebSocketServer | null = null; // exported reference
export function getWss(): WebSocketServer | null {
	return wss;
}

export function wssBroadcast(json: string) {
	const wss: WebSocketServer | null = getWss();
	if (!wss) return;
	wss.clients.forEach((client) => {
		if (client.readyState === client.OPEN) {
			client.send(json);
		}
	});
}

export function initWebsocket(server: any) {
	// const wss = new WebSocketServer({ server });
	console.log('[WS] Transaction WebSocket initialized');
	wss = new WebSocketServer({ noServer: true });

	server.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer<ArrayBufferLike>) => {
		if (req.url?.startsWith('/bigmarket-api/ws')) {
			wss!.handleUpgrade(req, socket, head, (ws) => {
				wss!.emit('connection', ws, req);
			});
		}
	});

	wss.on('connection', (ws: WebSocket) => {
		console.log('[WS] New connection established');

		ws.on('message', (msg: string) => {
			try {
				const data = JSON.parse(msg);
				console.log('[WS] Unexpecetd message from client: ', data);
			} catch (err) {
				console.error('[WS] Invalid message:', err);
			}
		});

		ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket ready for tx updates' }));
	});
}
