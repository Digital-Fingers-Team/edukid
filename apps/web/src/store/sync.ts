let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) { onUnauthorized = fn; }
export function notifyUnauthorized() { onUnauthorized?.(); }
