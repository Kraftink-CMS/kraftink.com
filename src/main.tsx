import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/app.css';
import './styles/site.css';
import './styles/integration.css';
import { AppProviders } from './AppProviders';
import { isLocale, resolveLocale } from '../shared/locales';
import type { PublicPageData } from './lib/rendering';

let initial: PublicPageData = { locale: resolveLocale(window.location.pathname.split('/')[1] ?? '') };
const serialized = document.getElementById('kraftink-page-data')?.textContent;
if (serialized) {
    try {
        const parsed: unknown = JSON.parse(serialized);
        if (parsed && typeof parsed === 'object' && 'locale' in parsed && isLocale(parsed.locale)) {
            initial = parsed as PublicPageData;
        }
    } catch {
        initial = { locale: initial.locale };
    }
}
const root = document.getElementById('root')!;
const application = (
    <BrowserRouter>
        <AppProviders initial={initial} />
    </BrowserRouter>
);
if (root.dataset.ssr === 'true') {
    hydrateRoot(root, application);
} else {
    createRoot(root).render(application);
}
