import { App } from './App';
import { LocaleProvider } from './lib/i18n';
import { PublicPageProvider, type PublicPageData } from './lib/rendering';
import { SessionProvider } from './lib/session';

export function AppProviders({ initial }: { initial: PublicPageData }) {
    return (
        <LocaleProvider>
            <PublicPageProvider initial={initial}>
                <SessionProvider>
                    <App />
                </SessionProvider>
            </PublicPageProvider>
        </LocaleProvider>
    );
}
