export interface StaticTranslations {
    [key: string]: string | StaticTranslations;
}

const decoder = new TextDecoder('utf-8', { fatal: true });
const doubleEscapes: Record<string, string> = {
    n: '\n',
    r: '\r',
    t: '\t',
    v: '\v',
    e: '\x1b',
    f: '\f',
    '\\': '\\',
    '"': '"',
    '$': '$',
};

export function parseStaticTranslations(source: string): StaticTranslations {
    if (source.length > 128 * 1024) {
        throw new Error('archive_metadata');
    }
    let offset = 0;
    let nodes = 0;
    const invalid = (): never => {
        throw new Error('archive_metadata');
    };
    const skip = () => {
        while (offset < source.length) {
            if (/\s/.test(source[offset])) {
                offset += 1;
            } else if (source.startsWith('//', offset) || source[offset] === '#') {
                const end = source.indexOf('\n', offset);
                offset = end < 0 ? source.length : end + 1;
            } else if (source.startsWith('/*', offset)) {
                const end = source.indexOf('*/', offset + 2);
                if (end < 0) {
                    invalid();
                }
                offset = end + 2;
            } else {
                break;
            }
        }
    };
    const string = (): string => {
        const quote = source[offset++];
        const parts: string[] = [];
        const bytes: number[] = [];
        let start = offset;
        const flushBytes = () => {
            if (bytes.length) {
                parts.push(decoder.decode(Uint8Array.from(bytes)));
                bytes.length = 0;
            }
        };
        while (offset < source.length) {
            const character = source[offset++];
            if (character === quote) {
                flushBytes();
                parts.push(source.slice(start, offset - 1));
                return parts.join('');
            }
            if (quote === '"' && character === '$') {
                invalid();
            }
            if (character !== '\\') {
                continue;
            }
            if (offset >= source.length) {
                invalid();
            }
            const raw = source.slice(start, offset - 1);
            if (raw) {
                flushBytes();
                parts.push(raw);
            }
            const escaped = source[offset++];
            if (quote === "'") {
                flushBytes();
                parts.push(escaped === "'" || escaped === '\\' ? escaped : `\\${escaped}`);
            } else if (/[0-7]/.test(escaped)) {
                let octal = escaped;
                while (octal.length < 3 && /[0-7]/.test(source[offset] ?? '')) {
                    octal += source[offset++];
                }
                bytes.push(parseInt(octal, 8) & 255);
            } else if (escaped === 'x' && /[0-9a-f]/i.test(source[offset] ?? '')) {
                let hexadecimal = source[offset++];
                if (/[0-9a-f]/i.test(source[offset] ?? '')) {
                    hexadecimal += source[offset++];
                }
                bytes.push(parseInt(hexadecimal, 16));
            } else {
                flushBytes();
                if (escaped === 'u' && source[offset] === '{') {
                    const match = /^\{([0-9a-f]{1,6})\}/i.exec(source.slice(offset));
                    if (!match) {
                        return invalid();
                    }
                    const codepoint = parseInt(match[1], 16);
                    if (codepoint > 0x10ffff || (codepoint >= 0xd800 && codepoint <= 0xdfff)) {
                        invalid();
                    }
                    parts.push(String.fromCodePoint(codepoint));
                    offset += match[0].length;
                } else {
                    parts.push(doubleEscapes[escaped] ?? `\\${escaped}`);
                }
            }
            start = offset;
        }
        return invalid();
    };
    const value = (depth: number): string | StaticTranslations => {
        nodes += 1;
        if (depth > 32 || nodes > 32768) {
            invalid();
        }
        skip();
        if (source[offset] === "'" || source[offset] === '"') {
            return string();
        }
        let closing: string;
        if (source[offset] === '[') {
            offset += 1;
            closing = ']';
        } else if (/^array\b/i.test(source.slice(offset))) {
            offset += 5;
            skip();
            if (source[offset++] !== '(') {
                return invalid();
            }
            closing = ')';
        } else {
            return invalid();
        }
        const result: StaticTranslations = Object.create(null);
        let nextIndex = 0;
        skip();
        while (source[offset] !== closing) {
            const integer = /^-?(?:0|[1-9][0-9]{0,15})(?![0-9])/.exec(source.slice(offset));
            let first: string | StaticTranslations;
            if (integer) {
                first = integer[0];
                offset += integer[0].length;
            } else {
                first = value(depth + 1);
            }
            skip();
            let key: string;
            let entry: string | StaticTranslations;
            if (source.startsWith('=>', offset)) {
                if (typeof first !== 'string') {
                    invalid();
                }
                key = first as string;
                offset += 2;
                entry = value(depth + 1);
                if (/^(?:0|[1-9][0-9]{0,15})$/.test(key)) {
                    nextIndex = Math.max(nextIndex, Number(key) + 1);
                }
            } else {
                if (integer) {
                    invalid();
                }
                key = String(nextIndex++);
                entry = first;
            }
            if (Object.hasOwn(result, key)) {
                invalid();
            }
            result[key] = entry;
            skip();
            if (source[offset] === closing) {
                break;
            }
            if (source[offset++] !== ',') {
                invalid();
            }
            skip();
        }
        offset += 1;
        return result;
    };
    offset = /^\s*/.exec(source)![0].length;
    if (!/^<\?php\s/i.test(source.slice(offset))) {
        invalid();
    }
    offset += 5;
    skip();
    const keyword = /^return\b/i.exec(source.slice(offset));
    if (!keyword) {
        invalid();
    }
    offset += keyword![0].length;
    const result = value(0);
    skip();
    if (typeof result === 'string' || source[offset++] !== ';') {
        invalid();
    }
    skip();
    if (source.startsWith('?>', offset)) {
        offset += 2;
        if (!/^\s*$/.test(source.slice(offset))) {
            invalid();
        }
        offset = source.length;
    }
    if (offset !== source.length) {
        invalid();
    }
    return result as StaticTranslations;
}
