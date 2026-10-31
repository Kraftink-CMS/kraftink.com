import { defineConfig } from 'vitest/config';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';

export default defineConfig({
    plugins: [
        cloudflareTest({
            main: './server/index.ts',
            remoteBindings: false,
            miniflare: {
                compatibilityDate: '2026-10-23',
                compatibilityFlags: ['nodejs_compat'],
                d1Databases: ['DB'],
                r2Buckets: ['BUCKET'],
                bindings: {
                    APP_ORIGIN: 'https://kraftink.test',
                    ENVIRONMENT: 'test',
                    GITHUB_CATALOGUE_URL: 'https://raw.githubusercontent.com/kraftink-cms/Market/master/catalogue.json',
                    GITHUB_RELEASES_URL: 'https://api.github.com/repos/kraftink-cms/Kraftink/releases',
                    TEST_MIGRATIONS: await readD1Migrations('./migrations'),
                },
            },
        }),
    ],
    test: {
        include: ['server/**/*.test.ts', 'shared/**/*.test.ts'],
        setupFiles: ['./tests/setup.ts'],
        testTimeout: 30000,
        hookTimeout: 30000,
        fileParallelism: false,
    },
});
