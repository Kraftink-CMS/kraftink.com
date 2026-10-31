export function toBase64Url(value: Uint8Array): string {
    let binary = '';
    for (let offset = 0; offset < value.length; offset += 4096) {
        binary += String.fromCharCode(...value.subarray(offset, offset + 4096));
    }
    return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function fromBase64Url(value: string): Uint8Array {
    const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
    return Uint8Array.from(atob(normalized), (character) => character.charCodeAt(0));
}

export function randomToken(bytes = 32): string {
    return toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function sha256(value: string | Uint8Array): Promise<string> {
    const data =
        typeof value === 'string'
            ? new TextEncoder().encode(value)
            : value.buffer instanceof ArrayBuffer
              ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
              : new Uint8Array(value);
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)), (byte) =>
        byte.toString(16).padStart(2, '0'),
    ).join('');
}

export function constantTimeEqual(first: string | Uint8Array, second: string | Uint8Array): boolean {
    const left = typeof first === 'string' ? new TextEncoder().encode(first) : first;
    const right = typeof second === 'string' ? new TextEncoder().encode(second) : second;
    let difference = left.length ^ right.length;
    const size = Math.max(left.length, right.length);
    for (let index = 0; index < size; index += 1) {
        difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
    }
    return difference === 0;
}

export async function signDocument(
    document: unknown,
    encodedKey: string,
): Promise<{ payload: string; signature: string }> {
    const bytes = new TextEncoder().encode(JSON.stringify(document));
    const key = await crypto.subtle.importKey('pkcs8', new Uint8Array(fromBase64Url(encodedKey)), 'Ed25519', false, [
        'sign',
    ]);
    const signature = await crypto.subtle.sign('Ed25519', key, bytes);
    return { payload: toBase64Url(bytes), signature: toBase64Url(new Uint8Array(signature)) };
}
