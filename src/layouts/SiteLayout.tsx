import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Select } from '../components/Select';
import { useLocale, useSiteCopy } from '../lib/i18n';
import { isLocale, localeRegistry } from '../../shared/locales';
import { useSession } from '../lib/session';
import { commonMessages, legalMessages, statisticsMessages } from '../lib/translations';
import { LocaleRedirect } from '../routing/LocaleRedirect';
import { hasRole } from '../../shared/auth';
import { PageMetadata } from '../components/PageMetadata';
import { DiscordIcon } from '../components/DiscordIcon';
import { discordUrl, externalLinkRel } from '../../shared/links';

export function SiteLayout() {
    const { locale, path } = useLocale();
    const { user, logout } = useSession();
    const text = commonMessages[locale];
    const legal = legalMessages[locale];
    const copy = useSiteCopy();
    const location = useLocation();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const route = useParams();
    const relative = location.pathname.split('/').slice(2).join('/');
    const workspace = /^(account|creator|moderation|admin)(\/|$)/.test(relative);
    const original = ['', 'features', 'about'].includes(relative.replace(/\/$/, ''));

    useEffect(() => {
        document.documentElement.lang = locale;
        document.documentElement.dir = localeRegistry[locale]?.direction ?? 'ltr';
        try {
            localStorage.setItem('kraftink.locale', locale);
        } catch {}
    }, [locale]);

    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!location.hash) {
            window.scrollTo({ top: 0 });
        }
    }, [location.pathname, location.hash]);

    if (!isLocale(route.locale)) {
        return <LocaleRedirect />;
    }

    const accountLinks = [
        { to: '/account', label: text.account, allowed: Boolean(user) },
        { to: '/creator', label: text.creator, allowed: hasRole(user, 'creator') },
        { to: '/moderation', label: text.moderation, allowed: hasRole(user, 'moderator') },
        { to: '/admin/statistics', label: statisticsMessages[locale].title, allowed: hasRole(user, 'admin') },
        { to: '/admin/users', label: text.users, allowed: hasRole(user, 'admin') },
        { to: '/admin/announcements', label: text.announcements, allowed: hasRole(user, 'admin') },
    ].filter((link) => link.allowed);

    return (
        <>
            <PageMetadata />
            <a className="visually-hidden-focusable skip-link" href="#main-content">
                {copy.skip}
            </a>
            <header className="site-header">
                <nav className="navbar navbar-expand-xl" aria-label={copy.navLabel}>
                    <div className="container header-inner gap-3">
                        <Link className="navbar-brand brand" to={path('/')} aria-label={`KraftInk - ${copy.home}`}>
                            <img src="/assets/brand/logo.svg" width="154" height="51" alt="KraftInk" />
                        </Link>
                        <button
                            className="navbar-toggler"
                            type="button"
                            aria-controls="main-navigation"
                            aria-expanded={menuOpen}
                            aria-label={copy.menu}
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            <span className="navbar-toggler-icon" />
                        </button>
                        <div className={`collapse navbar-collapse${menuOpen ? ' show' : ''}`} id="main-navigation">
                            <ul className="navbar-nav me-auto">
                                <li className="nav-item">
                                    <NavLink className="nav-link" end to={path('/')}>
                                        {copy.home}
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink className="nav-link" to={path('/features')}>
                                        {copy.nav[0][0]}
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink className="nav-link" to={path('/market')}>
                                        {copy.market.pageTitle}
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink className="nav-link" to={path('/documentation')}>
                                        {copy.docs.title}
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <a
                                        className="nav-link d-inline-flex align-items-center gap-2"
                                        href={discordUrl}
                                        target="_blank"
                                        rel={externalLinkRel(discordUrl)}
                                    >
                                        <DiscordIcon />
                                        {copy.community.name}
                                    </a>
                                </li>
                            </ul>
                            <div className="site-header-actions">
                                <label htmlFor="site-language" className="visually-hidden">
                                    {copy.languageLabel}
                                </label>
                                <Select
                                    id="site-language"
                                    className="form-select site-language-select"
                                    value={locale}
                                    onChange={(event) => {
                                        const next = event.target.value;
                                        if (isLocale(next)) {
                                            navigate(
                                                `/${next}${relative ? '/' + relative : ''}${location.search}${location.hash}`,
                                            );
                                        }
                                    }}
                                >
                                    {Object.entries(localeRegistry).map(([code, language]) => (
                                        <option value={code} key={code} lang={code}>
                                            {language.nativeName}
                                        </option>
                                    ))}
                                </Select>
                                <Link to={path('/downloads')} className="btn btn-primary btn-sm">
                                    {copy.download}
                                </Link>
                                {user ? (
                                    <details className="account-menu" key={location.pathname}>
                                        <summary>
                                            <span className="user-avatar">
                                                {user.username.slice(0, 1).toUpperCase()}
                                            </span>
                                            <span className="account-name">{user.username}</span>
                                        </summary>
                                        <div>
                                            {accountLinks.map(({ to, label }) => (
                                                <Link key={to} to={path(to)}>
                                                    {label}
                                                </Link>
                                            ))}
                                            <button type="button" onClick={() => logout().catch(() => undefined)}>
                                                {text.logout}
                                            </button>
                                        </div>
                                    </details>
                                ) : (
                                    <Link className="btn btn-outline-secondary btn-sm" to={path('/login')}>
                                        {text.login}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>
            </header>
            <main
                id="main-content"
                className={`site-main site-content${original ? ' original-public' : ''}${relative === '' ? ' home-content' : ''}${workspace ? ' workspace-main' : ''}`}
            >
                {original ? (
                    <Outlet />
                ) : (
                    <div className="container site-container">
                        {workspace && accountLinks.length > 1 && (
                            <nav className="workspace-nav" aria-label={text.account}>
                                {accountLinks.map(({ to, label }) => (
                                    <NavLink key={to} to={path(to)}>
                                        {label}
                                    </NavLink>
                                ))}
                            </nav>
                        )}
                        <Outlet />
                    </div>
                )}
            </main>
            <footer className="site-footer border-top py-4">
                <div className="container">
                    <div className="row g-4 justify-content-between align-items-start">
                        <div className="col-lg-4">
                            <Link to={path('/')} className="footer-brand">
                                KraftInk
                            </Link>
                            <p className="footer-description text-body-secondary small mt-2 mb-0">{copy.tagline}</p>
                        </div>
                        <div className="col-lg-auto">
                            <nav className="d-flex flex-wrap gap-3 small" aria-label={copy.footer.resources}>
                                <Link to={path('/documentation')} className="link-secondary">
                                    {copy.docs.title}
                                </Link>
                                <Link to={path('/about')} className="link-secondary">
                                    {copy.footer.about}
                                </Link>
                                <Link to={path('/terms')} className="link-secondary">
                                    {legal.terms.title}
                                </Link>
                                <Link to={path('/privacy')} className="link-secondary">
                                    {legal.privacy.title}
                                </Link>
                                <a
                                    href="https://github.com/kraftink-cms"
                                    className="link-secondary"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    GitHub
                                </a>
                                <a
                                    href={discordUrl}
                                    className="link-secondary d-inline-flex align-items-center gap-2"
                                    target="_blank"
                                    rel={externalLinkRel(discordUrl)}
                                >
                                    <DiscordIcon />
                                    {copy.community.name}
                                </a>
                            </nav>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <small className="text-body-secondary">© {new Date().getFullYear()} KraftInk</small>
                    </div>
                </div>
            </footer>
        </>
    );
}
