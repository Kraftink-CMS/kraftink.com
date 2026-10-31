import { Link } from 'react-router-dom';
import { useLocale, useSiteCopy } from '../../lib/i18n';

export function Compatibility() {
    const copy = useSiteCopy();
    const { path } = useLocale();
    return (
        <>
            <section className="product-compatibility" aria-labelledby="games-title">
                <div className="compatibility-heading">
                    <h2 id="games-title">{copy.landing.gamesTitle}</h2>
                    <p>{copy.landing.gamesDescription}</p>
                    <Link to={path('/documentation/games')}>{copy.landing.gamesLink}</Link>
                </div>
                <ul className="supported-games">
                    {copy.games.map((game) => (
                        <li key={game}>{game}</li>
                    ))}
                </ul>
            </section>
            <section className="product-languages" aria-labelledby="languages-title">
                <div>
                    <h2 id="languages-title">{copy.landing.languagesTitle}</h2>
                    <p>{copy.landing.languagesDescription}</p>
                </div>
                <ul>
                    {copy.cmsLanguages.map((language) => (
                        <li key={language}>{language}</li>
                    ))}
                </ul>
            </section>
        </>
    );
}
