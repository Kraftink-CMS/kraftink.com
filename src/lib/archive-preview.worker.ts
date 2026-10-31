import { ArchiveError, inspectArchive, isNewerVersion, maxArchiveBytes } from '../../shared/packages/zip';

const scope = globalThis as unknown as {
    onmessage:
        | ((
              event: MessageEvent<{
                  file: File;
                  maxUploadBytes: number;
                  expected?: { slug: string; type: 'plugin' | 'theme' | 'game' };
                  previousVersion?: string;
              }>,
          ) => Promise<void>)
        | null;
    postMessage: (value: unknown) => void;
};

scope.onmessage = async (event) => {
    try {
        const { file, maxUploadBytes, expected, previousVersion } = event.data;
        if (
            !(file instanceof File) ||
            !Number.isSafeInteger(maxUploadBytes) ||
            maxUploadBytes <= 0 ||
            file.size <= 0 ||
            file.size > Math.min(maxUploadBytes, maxArchiveBytes) ||
            !file.name.toLowerCase().endsWith('.zip')
        ) {
            scope.postMessage({ error: 'archive_size' });
            return;
        }
        const inspection = inspectArchive(new Uint8Array(await file.arrayBuffer()), expected);
        if (!isNewerVersion(inspection.manifest.version, previousVersion)) {
            scope.postMessage({ error: 'version_must_increase' });
            return;
        }
        scope.postMessage({ inspection });
    } catch (cause) {
        scope.postMessage({ error: cause instanceof ArchiveError ? cause.code : 'archive_invalid' });
    }
};
