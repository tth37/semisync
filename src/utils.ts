export function getCurrentTime(): string {
    return new Date().toISOString();
}

export function getDefaultTime(): string {
    return "1970-01-01T00:00:00.000Z";
}

export function getDiffSeconds(dateStr: string): number {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return Math.floor(diff / 1000);
}
