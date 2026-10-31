import { useRef, useState } from 'react';
import { useLocale, useSiteCopy } from '../../lib/i18n';
import { fallbackLocale } from '../../../shared/locales';

function screenshotCandidates(filename: string, locale: string): string[] {
    const stem = filename.replace(/\.(?:png|jpe?g|webp)$/i, '');
    const names = [...new Set([filename, `${stem}.png`, `${stem}.jpg`, `${stem}.jpeg`, `${stem}.webp`])];
    return [...new Set([locale, fallbackLocale])].flatMap((language) =>
        names.map((name) => `/assets/screenshots/${language}/${name}`),
    );
}

export function Screenshot({ filename, alt, primary = false }: { filename: string; alt: string; primary?: boolean }) {
    const { locale } = useLocale();
    return <ScreenshotView key={`${locale}:${filename}`} filename={filename} alt={alt} primary={primary} />;
}

function ScreenshotView({ filename, alt, primary }: { filename: string; alt: string; primary: boolean }) {
    const { locale } = useLocale();
    const copy = useSiteCopy();
    const [candidate, setCandidate] = useState(0);
    const [zoomSource, setZoomSource] = useState('');
    const picture = useRef<HTMLImageElement>(null);
    const preview = useRef<HTMLDialogElement>(null);
    const candidates = screenshotCandidates(filename, locale);

    return (
        <>
            <button
                className="screenshot-zoom"
                type="button"
                aria-label={copy.preview}
                onClick={() => {
                    setZoomSource(picture.current?.currentSrc || candidates[candidate]);
                    preview.current?.showModal();
                }}
            >
                <img
                    ref={picture}
                    className="img-fluid w-100"
                    src={candidates[candidate]}
                    width="1280"
                    height="720"
                    alt={alt}
                    loading={primary ? 'eager' : 'lazy'}
                    data-workspace-image={primary ? '' : undefined}
                    onError={() => {
                        if (candidate < candidates.length - 1) {
                            setCandidate(candidate + 1);
                        }
                    }}
                />
            </button>
            <dialog
                ref={preview}
                className="image-preview"
                aria-label={alt}
                onClick={(event) => {
                    if (event.target === event.currentTarget) {
                        preview.current?.close();
                    }
                }}
            >
                <button
                    type="button"
                    className="btn btn-light"
                    aria-label={copy.close}
                    onClick={() => preview.current?.close()}
                >
                    ×
                </button>
                <img src={zoomSource || undefined} alt={alt} />
            </dialog>
        </>
    );
}
