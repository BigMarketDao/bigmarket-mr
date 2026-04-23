import { writable } from 'svelte/store';
export const storedBnsData = writable();
export const storedBoard = writable();
export const storedBoards = writable([]);
export async function loadBoards(api) {
    try {
        const res = await fetch(`${api}/forum/boards`);
        if (!res.ok)
            throw new Error('Failed to load boards');
        const data = await res.json();
        return data;
    }
    catch (err) {
        console.error('Error loading threads:', err);
        return [];
    }
}
export async function loadBoard(api, messageBoardId) {
    try {
        const res = await fetch(`${api}/forum/board/${messageBoardId}`);
        if (!res.ok)
            throw new Error('Failed to load boards');
        const data = await res.json();
        return data;
    }
    catch (err) {
        console.error('Error loading threads:', err);
        return;
    }
}
export async function loadBoardMessages(api, messageBoardId) {
    try {
        const res = await fetch(`${api}/forum/board-messages/${messageBoardId}`);
        if (!res.ok)
            throw new Error('Failed to load messages');
        const data = await res.json();
        return data;
    }
    catch (err) {
        console.error('Error loading threads:', err);
    }
}
/**
 * Top level message/thread returned with nested replies. There is one thread per prediciton market!
 * @param api
 * @param messageId
 * @returns
 */
export async function loadThread(api, messageId) {
    try {
        const res = await fetch(`${api}/forum/messages/${messageId}`);
        if (!res.ok)
            throw new Error('Failed to load messages');
        const data = await res.json();
        return data;
    }
    catch (err) {
        console.error('Error loading threads:', err);
    }
}
export async function createThread(api, threadId, payload) {
    const res = await fetch(`${api}/forum/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok)
        throw new Error('Failed to create thread');
    return await loadThread(api, threadId); // refresh local store
}
export async function createBoard(api, payload) {
    const res = await fetch(`${api}/forum/board`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok)
        throw new Error('Failed to create board');
    const data = await loadBoards(api); // refresh local store
    storedBoards.set(data);
    if (data.length)
        storedBoard.set(data[0]);
}
//# sourceMappingURL=threads.js.map