import { App } from './App';
import { LocaleProvider } from './lib/i18n';
import { PublicPageProvider, type PageData } from './lib/rendering';
import { SessionProvider } from './lib/session';

export function AppProviders({ initial }: { initial: PageData }) {
    const { session, ...page } = initial;
    return (
        <LocaleProvider>
            <PublicPageProvider initial={page}>
                <SessionProvider initial={session}>
                    <App />
                </SessionProvider>
            </PublicPageProvider>
        </LocaleProvider>
    );
}
