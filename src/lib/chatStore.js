// In-memory / persistent chat prediction store for AiAgent polling
const globalChatStore = globalThis.__chatStore || new Map();
globalThis.__chatStore = globalChatStore;

export function setChatResult(id, data) {
    globalChatStore.set(id, {
        ...data,
        timestamp: Date.now()
    });
}

export function getChatResult(id) {
    return globalChatStore.get(id);
}
