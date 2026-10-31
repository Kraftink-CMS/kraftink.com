export interface RasterInfo {
    mime: 'image/png' | 'image/jpeg' | 'image/webp';
    width: number;
    height: number;
}

export const maxPreviewBytes = 2 * 1024 * 1024;

function invalid(): never {
    throw new Error('archive_image');
}

function dimensions(mime: RasterInfo['mime'], width: number, height: number): RasterInfo {
    if (
        !Number.isInteger(width) ||
        !Number.isInteger(height) ||
        width < 1 ||
        height < 1 ||
        width > 4096 ||
        height > 4096 ||
        width * height > 16777216
    ) {
        invalid();
    }
    return { mime, width, height };
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
    return String.fromCharCode(...bytes.subarray(start, start + length));
}

function png(bytes: Uint8Array, view: DataView): RasterInfo {
    if (bytes.length < 57 || view.getUint32(8) !== 13 || ascii(bytes, 12, 4) !== 'IHDR') {
        invalid();
    }
    const result = dimensions('image/png', view.getUint32(16), view.getUint32(20));
    const depth = bytes[24];
    const color = bytes[25];
    const depths: Record<number, number[]> = {
        0: [1, 2, 4, 8, 16],
        2: [8, 16],
        3: [1, 2, 4, 8],
        4: [8, 16],
        6: [8, 16],
    };
    if (!depths[color]?.includes(depth) || bytes[26] !== 0 || bytes[27] !== 0 || bytes[28] > 1) {
        invalid();
    }
    let offset = 8;
    let pixels = false;
    let ended = false;
    let chunks = 0;
    while (offset + 12 <= bytes.length && chunks < 4096) {
        const length = view.getUint32(offset);
        const type = ascii(bytes, offset + 4, 4);
        const end = offset + 12 + length;
        if (
            end > bytes.length ||
            !/^[A-Za-z]{4}$/.test(type) ||
            (offset !== 8 && type === 'IHDR') ||
            ['acTL', 'fcTL', 'fdAT'].includes(type)
        ) {
            invalid();
        }
        if (type === 'IDAT' && length > 0) {
            pixels = true;
        }
        if (type === 'IEND') {
            if (length !== 0 || end !== bytes.length) {
                invalid();
            }
            ended = true;
            break;
        }
        offset = end;
        chunks += 1;
    }
    if (!pixels || !ended) {
        invalid();
    }
    return result;
}

function jpeg(bytes: Uint8Array, view: DataView): RasterInfo {
    if (bytes.length < 20 || bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) {
        invalid();
    }
    let offset = 2;
    let frame: RasterInfo | undefined;
    for (let count = 0; count < 4096 && offset < bytes.length - 2; count += 1) {
        if (bytes[offset] !== 0xff) {
            invalid();
        }
        while (bytes[offset] === 0xff) {
            offset += 1;
        }
        const marker = bytes[offset++];
        if (marker === undefined || marker === 0 || marker === 0xd8 || marker === 0xd9 || offset + 2 > bytes.length) {
            invalid();
        }
        if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
            continue;
        }
        const length = view.getUint16(offset);
        if (length < 2 || offset + length > bytes.length - 2) {
            invalid();
        }
        if ([0xc0, 0xc1, 0xc2].includes(marker)) {
            if (
                frame ||
                length < 8 ||
                bytes[offset + 2] !== 8 ||
                ![1, 3, 4].includes(bytes[offset + 7]) ||
                length !== 8 + 3 * bytes[offset + 7]
            ) {
                invalid();
            }
            frame = dimensions('image/jpeg', view.getUint16(offset + 5), view.getUint16(offset + 3));
        }
        if (marker === 0xda) {
            if (!frame || length < 6 || offset + length >= bytes.length - 2) {
                invalid();
            }
            return frame;
        }
        offset += length;
    }
    invalid();
}

function webp(bytes: Uint8Array, view: DataView): RasterInfo {
    if (bytes.length < 26 || ascii(bytes, 8, 4) !== 'WEBP' || view.getUint32(4, true) + 8 !== bytes.length) {
        invalid();
    }
    let offset = 12;
    let result: RasterInfo | undefined;
    let frame: RasterInfo | undefined;
    for (let count = 0; count < 4096 && offset + 8 <= bytes.length; count += 1) {
        const type = ascii(bytes, offset, 4);
        const size = view.getUint32(offset + 4, true);
        const start = offset + 8;
        const end = start + size;
        if (end + (size & 1) > bytes.length || ['ANIM', 'ANMF'].includes(type)) {
            invalid();
        }
        if (type === 'VP8X') {
            if (
                offset !== 12 ||
                size !== 10 ||
                bytes[start] & 0xc3 ||
                bytes[start + 1] ||
                bytes[start + 2] ||
                bytes[start + 3]
            ) {
                invalid();
            }
            const width = 1 + bytes[start + 4] + (bytes[start + 5] << 8) + (bytes[start + 6] << 16);
            const height = 1 + bytes[start + 7] + (bytes[start + 8] << 8) + (bytes[start + 9] << 16);
            result = dimensions('image/webp', width, height);
        }
        if (type === 'VP8 ') {
            if (frame || size < 10 || bytes[start] & 1 || ascii(bytes, start + 3, 3) !== '\x9d\x01\x2a') {
                invalid();
            }
            frame = dimensions(
                'image/webp',
                view.getUint16(start + 6, true) & 0x3fff,
                view.getUint16(start + 8, true) & 0x3fff,
            );
        }
        if (type === 'VP8L') {
            if (frame || size < 5 || bytes[start] !== 0x2f) {
                invalid();
            }
            const bits = view.getUint32(start + 1, true);
            if (bits >>> 29) {
                invalid();
            }
            frame = dimensions('image/webp', 1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff));
        }
        offset = end + (size & 1);
    }
    if (
        offset !== bytes.length ||
        !frame ||
        (result && (result.width !== frame.width || result.height !== frame.height))
    ) {
        invalid();
    }
    return result ?? frame;
}

export function inspectRaster(bytes: Uint8Array, filename: string): RasterInfo {
    if (bytes.length === 0 || bytes.length > maxPreviewBytes) {
        invalid();
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let result: RasterInfo;
    if (bytes.length >= 8 && view.getUint32(0) === 0x89504e47 && view.getUint32(4) === 0x0d0a1a0a) {
        result = png(bytes, view);
    } else if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        result = jpeg(bytes, view);
    } else if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF') {
        result = webp(bytes, view);
    } else {
        invalid();
    }
    const extension = filename.split('.').at(-1)?.toLowerCase();
    if (
        (result.mime === 'image/png' && extension !== 'png') ||
        (result.mime === 'image/jpeg' && !['jpg', 'jpeg'].includes(extension ?? '')) ||
        (result.mime === 'image/webp' && extension !== 'webp')
    ) {
        invalid();
    }
    return result;
}
