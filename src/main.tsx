import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/app.css';
import './styles/site.css';
import './styles/integration.css';
import { AppProviders } from './AppProviders';
import type { PageData } from './lib/rendering';
import { setCsrfToken } from './lib/api';

const initial = JSON.parse(document.getElementById('kraftink-page-data')!.textContent!) as PageData;
setCsrfToken(initial.session.csrfToken ?? '');
const root = document.getElementById('root')!;
const application = (
    <BrowserRouter>
        <AppProviders initial={initial} />
    </BrowserRouter>
);
hydrateRoot(root, application);
