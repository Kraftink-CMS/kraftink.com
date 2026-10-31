import { App } from './App';
import { LocaleProvider } from './lib/i18n';
import { PublicPageProvider, type PageData } from './lib/rendering';
import { SessionProvider } from './lib/session';
import { useState } from 'react';

export function AppProviders({ initial }: { initial: PageData }) {
    const { session: initialSession, ...page } = initial;
    const [session, setSession] = useState(initialSession);
    return (
        <LocaleProvider preferred={session.preferredLocale}>
            <PublicPageProvider initial={page}>
                <SessionProvider session={session} onSessionChange={setSession}>
                    <App />
                </SessionProvider>
            </PublicPageProvider>
        </LocaleProvider>
    );
}
