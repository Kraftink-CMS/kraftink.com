import { Inflate } from 'fflate';
import { valid, gt } from 'semver';
import { requirements } from '../compatibility';
import { inspectRaster, maxPreviewBytes, type RasterInfo } from './raster';
import { parseStaticTranslations, type StaticTranslations } from './php-translations';

export type ResourceType = 'plugin' | 'theme' | 'game';
export type LocalizedText = string | Record<string, string>;
export const maxArchiveBytes = 100 * 1024 * 1024;

export interface ResourceManifest {
    id: string;
    name: string;
    type: ResourceType;
    version: string;
    requires: Record<string, unknown> & { cms: string; php: string };
    [key: string]: unknown;
}

export interface ArchiveInspection {
    manifest: ResourceManifest;
    metadata: {
        id: string;
        type: ResourceType;
        version: string;
        name: LocalizedText;
        description: LocalizedText;
        image?: LocalizedText;
    };
    image?: RasterInfo & { bytes: Uint8Array; path: string; locale: string | null };
    entries: number;
    expandedBytes: number;
}

export class ArchiveError extends Error {
    constructor(public code: string) {
        super(code);
    }
}

interface Entry {
    name: string;
    method: number;
    compressed: number;
    expanded: number;
    offset: number;
    crc: number;
    directory: boolean;
}

const decoder = new TextDecoder('utf-8', { fatal: true });
const MAX_ENTRIES = 10000;
const MAX_EXPANDED = 256 * 1024 * 1024;
const MAX_MANIFEST = 128 * 1024;
const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
        value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    }
    return value >>> 0;
});

function fail(code = 'archive_invalid'): never {
    throw new ArchiveError(code);
}

function crc32(bytes: Uint8Array): number {
    let crc = 0xffffffff;
    for (const value of bytes) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ value) & 255];
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function validPath(name: string): boolean {
    if (
        !name ||
        name.length > 512 ||
        name.startsWith('/') ||
        name.includes('\\') ||
        /[\x00-\x1f\x7f:<>"|?*]/.test(name)
    ) {
        return false;
    }
    const components = name.replace(/\/$/, '').split('/');
    return (
        components.every(
            (part) =>
                part !== '' &&
                part !== '.' &&
                part !== '..' &&
                !/[. ]$/.test(part) &&
                !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i.test(part),
        ) && name === name.normalize('NFC')
    );
}

function object(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function publicText(value: unknown, maximum: number): LocalizedText | null {
    const plain = (text: unknown): text is string =>
        typeof text === 'string' &&
        text.trim().length > 0 &&
        [...text].length <= maximum &&
        !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text) &&
        !/[\uD800-\uDFFF]/u.test(text) &&
        !/^[A-Za-z0-9_-]+::[A-Za-z0-9_.-]+$/.test(text.trim());
    if (plain(value)) {
        return value.trim();
    }
    if (!object(value) || Object.keys(value).length === 0 || Object.keys(value).length > 100) {
        return null;
    }
    if (
        Object.entries(value).some(
            ([locale, text]) =>
                locale.length > 35 || !/^[a-z]{2,3}(?:[-_][A-Za-z0-9]{2,8})*$/.test(locale) || !plain(text),
        )
    ) {
        return null;
    }
    return Object.fromEntries(Object.entries(value).map(([locale, text]) => [locale, (text as string).trim()]));
}

function extract(bytes: Uint8Array, entry: Entry, maximum: number, code: string): Uint8Array {
    if (entry.directory || entry.expanded === 0 || entry.expanded > maximum) {
        fail(code);
    }
    const compressed = bytes.subarray(entry.offset, entry.offset + entry.compressed);
    let result: Uint8Array;
    if (entry.method === 0) {
        result = compressed.slice();
    } else {
        result = new Uint8Array(entry.expanded);
        let length = 0;
        const inflater = new Inflate((chunk) => {
            if (length + chunk.length > entry.expanded) {
                fail(code);
            }
            result.set(chunk, length);
            length += chunk.length;
        });
        try {
            for (let offset = 0; offset < compressed.length; offset += 256) {
                inflater.push(compressed.subarray(offset, offset + 256), offset + 256 >= compressed.length);
            }
        } catch {
            fail(code);
        }
        if (length !== entry.expanded) {
            fail(code);
        }
    }
    if (result.length !== entry.expanded || crc32(result) !== entry.crc) {
        fail(code);
    }
    return result;
}

function checkExtra(bytes: Uint8Array, view: DataView, offset: number, length: number, name: string): void {
    const end = offset + length;
    while (offset < end) {
        if (offset + 4 > end) {
            fail();
        }
        const id = view.getUint16(offset, true);
        const size = view.getUint16(offset + 2, true);
        offset += 4;
        if (offset + size > end || id === 1 || id === 0x9901 || id === 0x756e) {
            fail();
        }
        if (id === 0x7075) {
            if (size < 5 || bytes[offset] !== 1) {
                fail('archive_path');
            }
            try {
                const alternative = decoder.decode(bytes.subarray(offset + 5, offset + size));
                if (
                    alternative !== name ||
                    view.getUint32(offset + 1, true) !== crc32(new TextEncoder().encode(name))
                ) {
                    fail('archive_path');
                }
            } catch {
                fail('archive_path');
            }
        }
        offset += size;
    }
}

function validatePackage(manifest: ResourceManifest, entries: Map<string, Entry>): void {
    const exists = (path: string) => Boolean(entries.get(path) && !entries.get(path)?.directory);
    if (
        manifest.type !== 'theme' ||
        manifest.namespace !== undefined ||
        manifest.provider !== undefined ||
        manifest.privacy !== undefined
    ) {
        const namespace = manifest.namespace;
        const provider = manifest.provider;
        if (
            typeof namespace !== 'string' ||
            !/^(?:[A-Za-z_][A-Za-z0-9_]*\\)+$/.test(namespace) ||
            typeof provider !== 'string' ||
            !provider.startsWith(namespace) ||
            !/^(?:[A-Za-z_][A-Za-z0-9_]*\\)*[A-Za-z_][A-Za-z0-9_]*$/.test(provider) ||
            !exists(`src/${provider.slice(namespace.length).replaceAll('\\', '/')}.php`)
        ) {
            fail('archive_provider');
        }
        if (
            manifest.privacy !== undefined &&
            (typeof manifest.privacy !== 'string' ||
                !manifest.privacy.startsWith(namespace) ||
                !/^(?:[A-Za-z_][A-Za-z0-9_]*\\)*[A-Za-z_][A-Za-z0-9_]*$/.test(manifest.privacy) ||
                !exists(`src/${manifest.privacy.slice(namespace.length).replaceAll('\\', '/')}.php`))
        ) {
            fail('archive_provider');
        }
    }
    if (
        manifest.target !== undefined &&
        (manifest.type !== 'theme' || !['site', 'admin'].includes(String(manifest.target)))
    ) {
        fail('archive_manifest');
    }
    if (manifest.assets !== undefined) {
        if (!object(manifest.assets)) {
            fail('archive_assets');
        }
        for (const key of ['styles', 'scripts', 'fonts', 'images']) {
            const assets = manifest.assets[key];
            if (assets === undefined) {
                continue;
            }
            if (
                !Array.isArray(assets) ||
                assets.length > MAX_ENTRIES ||
                assets.some(
                    (asset) =>
                        typeof asset !== 'string' ||
                        !/^[A-Za-z0-9_./-]+$/.test(asset) ||
                        asset.includes('..') ||
                        !validPath(asset) ||
                        !exists(`public/${asset}`),
                )
            ) {
                fail('archive_assets');
            }
        }
    }
    if (manifest.configuration !== undefined) {
        const configuration = manifest.configuration;
        if (
            !object(configuration) ||
            (configuration.route !== undefined &&
                (typeof configuration.route !== 'string' || !/^[A-Za-z0-9_.-]{1,160}$/.test(configuration.route))) ||
            (configuration.permission !== undefined &&
                (typeof configuration.permission !== 'string' ||
                    !/^[A-Za-z][A-Za-z0-9_.-]{0,159}$/.test(configuration.permission)))
        ) {
            fail('archive_manifest');
        }
        if (configuration.routes !== undefined) {
            const file = configuration.routes;
            if (
                manifest.type !== 'theme' ||
                !configuration.route ||
                typeof file !== 'string' ||
                !/^routes\/[A-Za-z0-9_-]+\.php$/.test(file) ||
                !exists(file)
            ) {
                fail('archive_assets');
            }
        }
    }
}

export function isNewerVersion(version: string, previous?: string | null): boolean {
    return valid(version) !== null && (!previous || gt(version, previous));
}

export function inspectArchive(
    bytes: Uint8Array,
    expected: { slug?: string; type?: string; version?: string; imageLocale?: string } = {},
): ArchiveInspection {
    if (bytes.byteLength < 22 || bytes.byteLength > maxArchiveBytes) {
        fail('archive_size');
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let eocd = -1;
    for (let cursor = bytes.byteLength - 22; cursor >= Math.max(0, bytes.byteLength - 65557); cursor--) {
        if (
            view.getUint32(cursor, true) === 0x06054b50 &&
            cursor + 22 + view.getUint16(cursor + 20, true) === bytes.byteLength
        ) {
            eocd = cursor;
            break;
        }
    }
    if (eocd < 0 || view.getUint16(eocd + 4, true) !== 0 || view.getUint16(eocd + 6, true) !== 0) {
        fail();
    }
    const count = view.getUint16(eocd + 10, true);
    const centralSize = view.getUint32(eocd + 12, true);
    const centralOffset = view.getUint32(eocd + 16, true);
    if (
        count === 0 ||
        count > MAX_ENTRIES ||
        count !== view.getUint16(eocd + 8, true) ||
        centralOffset + centralSize !== eocd
    ) {
        fail();
    }
    const names = new Set<string>();
    const directories = new Set<string>();
    const entries = new Map<string, Entry>();
    const ranges: Array<[number, number]> = [];
    let cursor = centralOffset;
    let expandedBytes = 0;
    let manifestEntry: Entry | undefined;
    for (let index = 0; index < count; index++) {
        if (cursor + 46 > eocd || view.getUint32(cursor, true) !== 0x02014b50) {
            fail();
        }
        const flags = view.getUint16(cursor + 8, true);
        const method = view.getUint16(cursor + 10, true);
        const compressed = view.getUint32(cursor + 20, true);
        const expanded = view.getUint32(cursor + 24, true);
        const nameLength = view.getUint16(cursor + 28, true);
        const extraLength = view.getUint16(cursor + 30, true);
        const commentLength = view.getUint16(cursor + 32, true);
        const disk = view.getUint16(cursor + 34, true);
        const attributes = view.getUint32(cursor + 38, true);
        const offset = view.getUint32(cursor + 42, true);
        const end = cursor + 46 + nameLength + extraLength + commentLength;
        if (
            end > eocd ||
            flags & ~0x080e ||
            ![0, 8].includes(method) ||
            disk !== 0 ||
            expanded === 0xffffffff ||
            compressed === 0xffffffff ||
            offset === 0xffffffff
        ) {
            fail();
        }
        let name: string;
        try {
            name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
        } catch {
            fail();
        }
        const mode = (attributes >>> 16) & 0xf000;
        const directory = name.endsWith('/');
        const normalized = name.toLowerCase().replace(/\/$/, '');
        if (
            !validPath(name) ||
            names.has(normalized) ||
            mode === 0xa000 ||
            (mode !== 0 && mode !== 0x8000 && mode !== 0x4000) ||
            (mode === 0x4000 && !directory) ||
            (mode === 0x8000 && directory)
        ) {
            fail('archive_path');
        }
        names.add(normalized);
        if (directory) {
            directories.add(normalized);
        }
        checkExtra(bytes, view, cursor + 46 + nameLength, extraLength, name);
        expandedBytes += expanded;
        if (
            expandedBytes > MAX_EXPANDED ||
            expanded > Math.max(1024 * 1024, compressed * 100) ||
            (method === 0 && compressed !== expanded)
        ) {
            fail('archive_expansion');
        }
        if (offset + 30 > centralOffset || view.getUint32(offset, true) !== 0x04034b50) {
            fail();
        }
        const localNameLength = view.getUint16(offset + 26, true);
        const localExtraLength = view.getUint16(offset + 28, true);
        const dataOffset = offset + 30 + localNameLength + localExtraLength;
        if (
            dataOffset + compressed > centralOffset ||
            view.getUint16(offset + 6, true) !== flags ||
            view.getUint16(offset + 8, true) !== method
        ) {
            fail();
        }
        let localName: string;
        try {
            localName = decoder.decode(bytes.subarray(offset + 30, offset + 30 + localNameLength));
        } catch {
            fail();
        }
        if (
            localName !== name ||
            (!(flags & 8) &&
                (view.getUint32(offset + 14, true) !== view.getUint32(cursor + 16, true) ||
                    view.getUint32(offset + 18, true) !== compressed ||
                    view.getUint32(offset + 22, true) !== expanded))
        ) {
            fail();
        }
        checkExtra(bytes, view, offset + 30 + localNameLength, localExtraLength, name);
        let dataEnd = dataOffset + compressed;
        if (flags & 8) {
            const crc = view.getUint32(cursor + 16, true);
            const signed =
                dataEnd + 16 <= centralOffset &&
                view.getUint32(dataEnd, true) === 0x08074b50 &&
                view.getUint32(dataEnd + 4, true) === crc &&
                view.getUint32(dataEnd + 8, true) === compressed &&
                view.getUint32(dataEnd + 12, true) === expanded;
            const unsigned =
                dataEnd + 12 <= centralOffset &&
                view.getUint32(dataEnd, true) === crc &&
                view.getUint32(dataEnd + 4, true) === compressed &&
                view.getUint32(dataEnd + 8, true) === expanded;
            if (
                (!signed && !unsigned) ||
                ![0, crc].includes(view.getUint32(offset + 14, true)) ||
                ![0, compressed].includes(view.getUint32(offset + 18, true)) ||
                ![0, expanded].includes(view.getUint32(offset + 22, true))
            ) {
                fail();
            }
            dataEnd += signed ? 16 : 12;
        }
        ranges.push([offset, dataEnd]);
        const entry = {
            name,
            method,
            compressed,
            expanded,
            offset: dataOffset,
            crc: view.getUint32(cursor + 16, true),
            directory,
        };
        entries.set(name, entry);
        if (name === 'manifest.json') {
            manifestEntry = entry;
        } else if (normalized === 'manifest.json') {
            fail('archive_manifest');
        }
        cursor = end;
    }
    if (cursor !== eocd || !manifestEntry || manifestEntry.expanded > MAX_MANIFEST || manifestEntry.expanded === 0) {
        fail('archive_manifest');
    }
    ranges.sort((left, right) => left[0] - right[0]);
    for (let index = 1; index < ranges.length; index++) {
        if (ranges[index][0] < ranges[index - 1][1]) {
            fail();
        }
    }
    for (const entry of entries.values()) {
        const components = entry.name.replace(/\/$/, '').split('/');
        for (let index = 1; index < components.length; index += 1) {
            const parent = components.slice(0, index).join('/').toLowerCase();
            if (names.has(parent) && !directories.has(parent)) {
                fail('archive_path');
            }
        }
    }
    let manifest: ResourceManifest;
    try {
        const inflated = extract(bytes, manifestEntry, MAX_MANIFEST, 'archive_manifest');
        manifest = JSON.parse(decoder.decode(inflated));
    } catch {
        fail('archive_manifest');
    }
    if (
        !manifest ||
        typeof manifest !== 'object' ||
        Array.isArray(manifest) ||
        typeof manifest.id !== 'string' ||
        !/^[a-z][a-z0-9-]{1,49}$/.test(manifest.id) ||
        /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/.test(manifest.id) ||
        (expected.slug !== undefined && manifest.id !== expected.slug) ||
        !['plugin', 'theme', 'game'].includes(manifest.type) ||
        (expected.type !== undefined && manifest.type !== expected.type) ||
        (expected.version !== undefined && manifest.version !== expected.version) ||
        typeof manifest.name !== 'string' ||
        !manifest.name.trim() ||
        [...manifest.name].length > 120 ||
        typeof manifest.version !== 'string' ||
        manifest.version.length > 100 ||
        valid(manifest.version) !== manifest.version
    ) {
        fail('archive_manifest');
    }
    if (!requirements(manifest.requires)) {
        fail('archive_requirements');
    }
    if (
        manifest.builtin ||
        manifest.default ||
        ['path', 'valid', 'enabled', 'error', 'cms', 'dependencies'].some((key) => Object.hasOwn(manifest, key))
    ) {
        fail('archive_reserved');
    }
    validatePackage(manifest, entries);
    if (manifest.market !== undefined && !object(manifest.market)) {
        fail('archive_metadata');
    }
    const market = object(manifest.market) ? manifest.market : {};
    const languageFiles = new Map<string, StaticTranslations>();
    const languageCodes = new Set<string>();
    let textBytes = manifestEntry.expanded;
    const translatedText = (value: unknown, maximum: number): LocalizedText | null => {
        if (typeof value !== 'string' || !value.includes('::')) {
            return publicText(value, maximum);
        }
        const reference =
            /^([a-z][a-z0-9-]{1,49})::([A-Za-z0-9_-]{1,100})\.([A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+){0,31})$/.exec(value);
        if (!reference || reference[1] !== manifest.id || value.length > 1024) {
            fail('archive_metadata');
        }
        const translations: Record<string, string> = {};
        for (const entry of entries.values()) {
            const path = /^lang\/([a-z]{2,3}(?:[-_][A-Za-z0-9]{2,8})*)\/([A-Za-z0-9_-]+)\.php$/.exec(entry.name);
            if (!path || path[1].length > 35 || path[2] !== reference[2] || entry.directory) {
                continue;
            }
            languageCodes.add(path[1]);
            if (languageCodes.size > 100) {
                fail('archive_metadata');
            }
            let values = languageFiles.get(entry.name);
            if (!values) {
                textBytes += entry.expanded;
                if (textBytes > 2 * 1024 * 1024) {
                    fail('archive_metadata');
                }
                try {
                    values = parseStaticTranslations(
                        decoder.decode(extract(bytes, entry, MAX_MANIFEST, 'archive_metadata')),
                    );
                } catch {
                    fail('archive_metadata');
                }
                languageFiles.set(entry.name, values);
            }
            let resolved: string | StaticTranslations | undefined = values;
            for (const key of reference[3].split('.')) {
                resolved = typeof resolved === 'object' && Object.hasOwn(resolved, key) ? resolved[key] : undefined;
            }
            if (resolved !== undefined) {
                const text = publicText(resolved, maximum);
                if (typeof text !== 'string') {
                    fail('archive_metadata');
                }
                translations[path[1]] = text;
            }
        }
        if (Object.keys(translations).length === 0) {
            fail('archive_metadata');
        }
        return Object.fromEntries(
            Object.entries(translations).sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0)),
        );
    };
    const name = translatedText(market.name ?? manifest.name, 120);
    const description = translatedText(market.description ?? manifest.description, 1000);
    if (!name || !description) {
        fail('archive_metadata');
    }
    let image: ArchiveInspection['image'];
    let images: LocalizedText | undefined;
    if (market.image !== undefined) {
        const value = publicText(market.image, 2048);
        if (!value) {
            fail('archive_image');
        }
        const paths = typeof value === 'string' ? [[null, value] as const] : Object.entries(value);
        const resolved = paths.map(([language, filename]) => {
            const path = filename.startsWith('resources/market/') ? filename : `resources/market/${filename}`;
            if (
                !/^(?:[A-Za-z0-9][A-Za-z0-9._-]*\/)*[A-Za-z0-9][A-Za-z0-9._-]*\.(?:png|jpe?g|webp)$/i.test(filename) ||
                !validPath(filename) ||
                !path.startsWith('resources/market/') ||
                !entries.has(path) ||
                entries.get(path)?.directory
            ) {
                fail('archive_image');
            }
            return { locale: language, path, entry: entries.get(path)! };
        });
        const locale = expected.imageLocale?.replaceAll('_', '-').toLowerCase();
        const selected =
            resolved.find((candidate) => candidate.locale?.replaceAll('_', '-').toLowerCase() === locale) ??
            resolved.find(
                (candidate) => locale && candidate.locale?.replaceAll('_', '-').toLowerCase() === locale.split('-')[0],
            ) ??
            resolved.find((candidate) => candidate.locale === 'en') ??
            resolved[0];
        const data = extract(bytes, selected.entry, maxPreviewBytes, 'archive_image');
        try {
            image = {
                ...inspectRaster(data, selected.path),
                bytes: data,
                path: selected.path,
                locale: selected.locale,
            };
        } catch {
            fail('archive_image');
        }
        images = value;
    }
    return {
        manifest,
        metadata: {
            id: manifest.id,
            type: manifest.type,
            version: manifest.version,
            name,
            description,
            ...(images ? { image: images } : {}),
        },
        ...(image ? { image } : {}),
        entries: count,
        expandedBytes,
    };
}
