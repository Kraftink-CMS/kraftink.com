import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fallbackLocale, localeRegistry } from '../shared/locales.ts';
import { loadLocalizedDocumentation, prepareDocumentation } from './documentation.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const qrcodeDependencies = createRequire(import.meta.resolve('qrcode'));
const documentation = await loadLocalizedDocumentation(root, Object.keys(localeRegistry), fallbackLocale);
await mkdir(path.join(root, 'public/generated'), { recursive: true });
await mkdir(path.join(root, 'public/assets'), { recursive: true });
await mkdir(path.join(root, 'public/licenses'), { recursive: true });
await Promise.all([
    cp(path.join(root, 'content/brand'), path.join(root, 'public/assets/brand'), { recursive: true }),
    cp(path.join(root, 'content/fonts'), path.join(root, 'public/assets/fonts'), { recursive: true }),
    cp(path.join(root, 'content/screenshots'), path.join(root, 'public/assets/screenshots'), { recursive: true }),
    cp(path.join(root, 'content/documentation'), path.join(root, 'public/documentation/source'), { recursive: true }),
    cp(path.join(root, 'content/documentation/fr/assets'), path.join(root, 'public/generated/assets'), {
        recursive: true,
    }).catch((error) => {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }),
    cp(path.join(root, 'node_modules/bootstrap/LICENSE'), path.join(root, 'public/licenses/bootstrap.txt')),
    cp(path.join(root, 'node_modules/marked/LICENSE.md'), path.join(root, 'public/licenses/marked.txt')),
    cp(path.join(root, 'node_modules/ipaddr.js/LICENSE'), path.join(root, 'public/licenses/ipaddr.txt')),
    Promise.all([
        readFile(path.join(root, 'node_modules/qrcode/license'), 'utf8'),
        readFile(qrcodeDependencies.resolve('dijkstrajs/LICENSE.md'), 'utf8'),
    ]).then((licenses) => writeFile(path.join(root, 'public/licenses/qrcode.txt'), licenses.join('\n\n'))),
    ...Object.keys(localeRegistry).map(async (locale) => {
        const documents = prepareDocumentation(documentation.get(locale), locale).map((guide) => ({
            ...guide,
            availableLocales: Object.keys(localeRegistry).filter(
                (code) =>
                    documentation.get(code)?.find((document) => document.slug === guide.slug)?.contentLocale === code,
            ),
        }));
        await writeFile(path.join(root, `public/generated/documentation-${locale}.json`), JSON.stringify(documents));
    }),
]);
const sources = JSON.parse(await readFile(path.join(root, 'content/sources.json'), 'utf8'));
await writeFile(path.join(root, 'public/generated/sources.json'), JSON.stringify(sources));
console.log('Prepared canonical KraftInk documentation, brand, fonts and screenshots.');
