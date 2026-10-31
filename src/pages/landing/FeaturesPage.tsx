import { Link } from 'react-router-dom';
import { Screenshot } from '../../components/landing/Screenshot';
import { Compatibility } from '../../components/landing/Compatibility';
import { PageTitle } from '../../components/UI';
import { useLocale, useSiteCopy } from '../../lib/i18n';

export function FeaturesPage() {
    const copy = useSiteCopy();
    const { path } = useLocale();
    const sections = copy.fullFeatures.sections as [string, string, string[], string, string][];
    return (
        <div className="container">
            <PageTitle title={copy.nav[0][0]} description={copy.fullFeatures.lead} />
            <div className="d-grid gap-4">
                {sections.map(([heading, summary, tags, image, guide]) => (
                    <section className="card feature-section" key={heading}>
                        <div className="card-body p-4">
                            <div className="row g-4 align-items-center">
                                <div className="col-lg-5">
                                    <h2 className="h4">{heading}</h2>
                                    <p className="text-body-secondary">{summary}</p>
                                    <ul className="feature-tags">
                                        {tags.map((tag) => (
                                            <li key={tag}>{tag}</li>
                                        ))}
                                    </ul>
                                    <Link className="text-decoration-none" to={path(`/documentation/${guide}`)}>
                                        {copy.fullFeatures.guide}
                                    </Link>
                                </div>
                                <div className="col-lg-7">
                                    <Screenshot filename={image} alt={heading} />
                                </div>
                            </div>
                        </div>
                    </section>
                ))}
            </div>
            <div className="features-compatibility">
                <Compatibility />
            </div>
        </div>
    );
}
