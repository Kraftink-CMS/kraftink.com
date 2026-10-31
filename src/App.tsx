import { Route, Routes, useLocation } from 'react-router-dom';
import { SiteLayout } from './layouts/SiteLayout';
import { RequireUser } from './routing/RequireUser';
import { LocaleRedirect } from './routing/LocaleRedirect';
import { HomePage } from './pages/landing/HomePage';
import { FeaturesPage } from './pages/landing/FeaturesPage';
import { AboutPage } from './pages/landing/AboutPage';
import { DownloadsPage } from './pages/landing/DownloadsPage';
import { MarketPage } from './pages/market/MarketPage';
import { ResourcePage } from './pages/market/ResourcePage';
import { CheckoutReturnPage } from './pages/market/CheckoutReturnPage';
import { DocumentationPage } from './pages/documentation/DocumentationPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AuthPage } from './pages/auth/AuthPage';
import { AccountPage } from './pages/account/AccountPage';
import { AdminUsersPage } from './pages/admin/UsersPage';
import { CreatorPage } from './pages/creator/CreatorPage';
import { ModerationPage } from './pages/moderation/ModerationPage';
import { AnnouncementsPage } from './pages/admin/AnnouncementsPage';
import { StatisticsPage } from './pages/admin/StatisticsPage';
import { LegalPage } from './pages/legal/LegalPage';
import { matchProtectedPage, protectedPages, type PrivatePage } from '../shared/routes';
import type { ReactNode } from 'react';

const privatePages = {
    'account': <AccountPage />,
    'creator': <CreatorPage />,
    'moderation': <ModerationPage />,
    'admin/users': <AdminUsersPage />,
    'admin/statistics': <StatisticsPage />,
    'admin/announcements': <AnnouncementsPage />,
    'checkout/success': <CheckoutReturnPage />,
} satisfies Record<PrivatePage, ReactNode>;

function PrivateRoute() {
    const location = useLocation();
    const page = matchProtectedPage(location.pathname.split('/').slice(2).join('/'));
    if (!page) {
        return <NotFoundPage />;
    }
    return <RequireUser role={page.role ?? undefined}>{privatePages[page.page]}</RequireUser>;
}

export function App() {
    return (
        <Routes>
            <Route path="/:locale" element={<SiteLayout />}>
                <Route index element={<HomePage />} />
                <Route path="features" element={<FeaturesPage />} />
                <Route path="market" element={<MarketPage />} />
                <Route path="market/resource" element={<ResourcePage />} />
                <Route path="market/resource/:resourceId" element={<ResourcePage />} />
                <Route path="documentation/*" element={<DocumentationPage />} />
                <Route path="downloads" element={<DownloadsPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="terms" element={<LegalPage kind="terms" />} />
                <Route path="privacy" element={<LegalPage kind="privacy" />} />
                <Route path="login" element={<AuthPage mode="login" />} />
                <Route path="register" element={<AuthPage mode="register" />} />
                <Route path="forgot-password" element={<AuthPage mode="forgot" />} />
                <Route path="reset-password" element={<AuthPage mode="reset" />} />
                <Route path="verify-email" element={<AuthPage mode="verify" />} />
                {protectedPages.map(({ path }) => (
                    <Route key={path} path={path} element={<PrivateRoute />} />
                ))}
                <Route path="*" element={<NotFoundPage />} />
            </Route>
            <Route path="*" element={<LocaleRedirect />} />
        </Routes>
    );
}
