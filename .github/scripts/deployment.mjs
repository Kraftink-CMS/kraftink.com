import { execFileSync } from 'node:child_process';
import { appendFile, lstat, mkdir, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

async function migrationFiles(directory) {
    const stat = await lstat(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
        throw new Error('D1 migrations must use a regular directory.');
    }
    const names = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
    if (names.length < 1 || names.length > 1000) {
        throw new Error('The build must contain between one and one thousand D1 migrations.');
    }
    const files = [];
    let total = 0;
    for (const name of names) {
        if (!/^\d{4,12}_[A-Za-z0-9][A-Za-z0-9_-]{0,119}\.sql$/.test(name)) {
            throw new Error('D1 migration filenames must contain a sequence and a safe SQL filename.');
        }
        const path = join(directory, name);
        const file = await lstat(path);
        if (!file.isFile() || file.isSymbolicLink() || file.size < 1 || file.size > 1048576) {
            throw new Error('Each D1 migration must be a regular SQL file of at most one MiB.');
        }
        const bytes = await readFile(path);
        total += bytes.length;
        if (bytes.length !== file.size || total > 16777216) {
            throw new Error('D1 migration files changed or exceed the sixteen MiB build limit.');
        }
        files.push({ name, bytes });
    }
    return files;
}

async function compiledConfiguration() {
    const root = await realpath(process.cwd());
    const directory = join(root, 'dist', 'kraftink');
    for (const path of [join(root, 'dist'), directory]) {
        const stat = await lstat(path);
        if (!stat.isDirectory() || stat.isSymbolicLink() || (await realpath(path)) !== path) {
            throw new Error('The compiled Worker must stay in regular build directories.');
        }
    }
    const path = join(directory, 'wrangler.json');
    const stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1048576) {
        throw new Error('The compiled Wrangler configuration must be a bounded regular file.');
    }
    const document = JSON.parse(await readFile(path, 'utf8'));
    const binding = Array.isArray(document.d1_databases)
        ? document.d1_databases.find((entry) => entry?.binding === 'DB')
        : null;
    if (!binding || binding.database_name !== 'kraftink') {
        throw new Error('The compiled Worker must contain the KraftInk D1 binding.');
    }
    return { root, directory, path, document, binding };
}

async function prepareBuild() {
    const build = await compiledConfiguration();
    const files = await migrationFiles(join(build.root, 'migrations'));
    const destination = join(build.directory, 'migrations');
    if (!destination.startsWith(build.directory + sep)) {
        throw new Error('Packaged migrations must stay inside the compiled Worker.');
    }
    try {
        const stat = await lstat(destination);
        if (!stat.isDirectory() || stat.isSymbolicLink() || (await realpath(destination)) !== destination) {
            throw new Error('The packaged migration directory must not redirect outside the build.');
        }
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
    await rm(destination, { recursive: true, force: true });
    await mkdir(destination);
    for (const file of files) {
        await writeFile(join(destination, file.name), file.bytes, { flag: 'wx' });
    }
    build.binding.migrations_dir = 'migrations';
    await writeFile(build.path, `${JSON.stringify(build.document, null, 2)}\n`);
}

const operation = process.argv[2];
if (operation === 'build') {
    await prepareBuild();
} else {
    const repository = process.env.GITHUB_REPOSITORY;
    if (repository !== 'Kraftink-CMS/kraftink.com' || process.env.GITHUB_REF !== 'refs/heads/master') {
        throw new Error('Deploy the KraftInk website from master in its source repository.');
    }
    const { createGitHubClient } = await import(
        pathToFileURL(resolve(process.env.AUTOMATION_ROOT, 'scripts/releases/github-client.mjs'))
    );
    const client = createGitHubClient({ repository, token: process.env.GITHUB_TOKEN });
    const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const dispatch = process.env.GITHUB_EVENT_NAME === 'repository_dispatch';
    if (!dispatch && process.env.GITHUB_EVENT_NAME !== 'push') {
        throw new Error('Deployment requires a master push or a verified release notification.');
    }
    if (dispatch && event.action !== 'kraftink-release-published') {
        throw new Error('The release deployment notification is invalid.');
    }
    const expected = dispatch ? event.client_payload?.commit : process.env.GITHUB_SHA;
    const tag = dispatch ? event.client_payload?.tag : null;
    const version = JSON.parse(await readFile('package.json', 'utf8')).version;
    if (
        typeof expected !== 'string' ||
        !/^[a-f0-9]{40}$/.test(expected) ||
        typeof version !== 'string' ||
        version.length > 100 ||
        !/^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)(?:-dev)?$/.test(version) ||
        (dispatch && (tag !== `v${version}` || version.endsWith('-dev')))
    ) {
        throw new Error('The deployment commit and source version must match the released source.');
    }
    const local = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', windowsHide: true }).trim();
    const master = await client.request('GET', '/git/ref/heads/master');
    if (
        local !== expected ||
        master?.ref !== 'refs/heads/master' ||
        master.object?.type !== 'commit' ||
        master.object.sha !== expected
    ) {
        throw new Error('master changed before deployment. Deploy its current validated source.');
    }
    if (dispatch && (await client.tag(tag)) !== expected) {
        throw new Error('The release tag does not identify the selected master commit.');
    }

    if (operation === 'prepare') {
        await appendFile(process.env.GITHUB_OUTPUT, `version=${version}\ncommit=${expected}\n`);
    } else if (operation === 'artifact') {
        if (!dispatch) {
            throw new Error('Only release notifications may download published deployment files.');
        }
        const release = await client.release(tag);
        if (!release || release.tag_name !== tag || release.draft !== false || release.prerelease !== false) {
            throw new Error('The stable website release must be published before deployment.');
        }
        const name = `kraftink-site-${version}.tar.gz`;
        const matching = (await client.assets(release)).filter((asset) => asset.name === name);
        if (matching.length !== 1) {
            throw new Error('The published website archive is missing or ambiguous.');
        }
        const bytes = await client.bytes(matching[0], 536870912);
        const archive = resolve(process.env.RUNNER_TEMP, name);
        await writeFile(archive, bytes, { flag: 'wx', mode: 0o600 });
        const list = (verbose) =>
            execFileSync('tar', ['--list', ...(verbose ? ['--verbose'] : []), '--gzip', '--file', archive], {
                encoding: 'utf8',
                windowsHide: true,
                timeout: 60000,
                maxBuffer: 16777216,
            })
                .trim()
                .split(/\r?\n/);
        const entries = list(false);
        if (
            entries.length > 10000 ||
            entries.some(
                (name) =>
                    /[\\\x00-\x1f\x7f]/.test(name) ||
                    !/^(?:client|kraftink)(?:\/|$)/.test(name) ||
                    name
                        .replace(/\/$/, '')
                        .split('/')
                        .some((part) => !part || part === '.' || part === '..') ||
                    /(?:^|\/)\.(?:env|dev\.vars)/.test(name),
            )
        ) {
            throw new Error('The website archive contains unexpected paths or environment files.');
        }
        let expanded = 0;
        for (const entry of list(true)) {
            const match = /^[-d][^\s]*\s+[^\s]+\s+(\d+)\s+/.exec(entry);
            if (!match || (expanded += Number(match[1])) > 1073741824) {
                throw new Error('The website archive contains unsafe entries or exceeds its size limit.');
            }
        }
        const destination = resolve('dist');
        await mkdir(destination, { recursive: true });
        const stat = await lstat(destination);
        if (!stat.isDirectory() || stat.isSymbolicLink() || (await readdir(destination)).length !== 0) {
            throw new Error('Extract deployment files into an empty regular dist directory.');
        }
        execFileSync(
            'tar',
            [
                '--extract',
                '--gzip',
                '--file',
                archive,
                '--directory',
                destination,
                '--no-same-owner',
                '--no-same-permissions',
            ],
            {
                stdio: 'inherit',
                windowsHide: true,
                timeout: 60000,
            },
        );
    } else if (operation === 'check') {
        const build = await compiledConfiguration();
        if (build.binding.migrations_dir !== 'migrations') {
            throw new Error('The deployment must use migrations contained in its verified archive.');
        }
        await migrationFiles(join(build.directory, 'migrations'));
    } else {
        throw new Error('Use deployment.mjs build, prepare, artifact or check.');
    }
}
