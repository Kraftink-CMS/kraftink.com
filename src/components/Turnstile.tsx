import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        turnstile?: {
            render(
                element: HTMLElement,
                options: {
                    sitekey: string;
                    callback: (token: string) => void;
                    'expired-callback': () => void;
                    'error-callback': () => void;
                },
            ): string;
            remove(id: string): void;
        };
    }
}

let loader: Promise<void> | undefined;

function load(): Promise<void> {
    if (window.turnstile) {
        return Promise.resolve();
    }
    loader ??= new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
            loader = undefined;
            reject(new Error('challenge_unavailable'));
        };
        document.head.appendChild(script);
    });
    return loader;
}

export function Turnstile({ siteKey, onToken }: { siteKey?: string | null; onToken: (token: string) => void }) {
    const element = useRef<HTMLDivElement>(null);
    const callback = useRef(onToken);
    callback.current = onToken;
    useEffect(() => {
        if (!siteKey) {
            return;
        }
        let disposed = false;
        let id: string | undefined;
        load()
            .then(() => {
                if (disposed || !element.current || !window.turnstile) {
                    return;
                }
                id = window.turnstile.render(element.current, {
                    sitekey: siteKey,
                    callback: (token) => callback.current(token),
                    'expired-callback': () => callback.current(''),
                    'error-callback': () => callback.current(''),
                });
            })
            .catch(() => callback.current(''));
        return () => {
            disposed = true;
            if (id) {
                window.turnstile?.remove(id);
            }
        };
    }, [siteKey]);
    return <div ref={element} className="turnstile-container" />;
}
