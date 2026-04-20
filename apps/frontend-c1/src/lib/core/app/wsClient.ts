// src/lib/ws/wsClient.ts
import { appConfigStore, requireAppConfig } from '$lib/stores/config/appConfigStore';
import { get } from 'svelte/store';
import { writable } from 'svelte/store';

export const wsConnected = writable(false);

type WsMessage = { type: string; [key: string]: unknown };
type MessageHandler = (msg: WsMessage) => void;

let ws: WebSocket | null = null;
const handlers: Record<string, MessageHandler[]> = {};

export function connectWebsockets() {
	if (ws && ws.readyState <= 1) return;

	const config = requireAppConfig(get(appConfigStore));
	ws = new WebSocket(config.VITE_BIGMARKET_WS);

	ws.onopen = () => {
		console.log('[WS] Connected to server');
		wsConnected.set(true);
	};

	ws.onclose = () => {
		console.warn('[WS] Disconnected, retrying in 3s');
		wsConnected.set(false);
		setTimeout(connectWebsockets, 3000); // auto-reconnect
	};

	ws.onerror = (err) => console.error('[WS] Error:', err);

	ws.onmessage = (event) => {
		try {
			const msg = JSON.parse(event.data);
			if (!msg.type) return;

			const subs = handlers[msg.type] || [];
			for (const fn of subs) fn(msg);
		} catch {
			console.warn('[WS] Failed to parse message:', event.data);
		}
	};
}

export function onMessage(type: string, handler: MessageHandler) {
	if (!handlers[type]) handlers[type] = [];
	handlers[type].push(handler);
	return () => {
		handlers[type] = handlers[type].filter((fn) => fn !== handler);
	};
}

export function sendMessage(type: string, payload: Record<string, unknown>) {
	if (ws?.readyState === WebSocket.OPEN) {
		ws.send(JSON.stringify({ type, ...payload }));
	} else {
		console.warn('[WS] Not connected, cannot send:', type);
	}
}
