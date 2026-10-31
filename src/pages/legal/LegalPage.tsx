import { PageTitle } from '../../components/UI';
import { useLocale } from '../../lib/i18n';
import { legalMessages } from '../../lib/translations';

export function LegalPage({ kind }: { kind: 'terms' | 'privacy' }) {
    const { locale } = useLocale();
    const copy = legalMessages[locale];
    const document = copy[kind];

    return (
        <>
            <PageTitle title={document.title} description={document.lead} />
            <article className="card card-body p-4 p-lg-5 legal-content">
                {document.sections.map((section) => (
                    <section key={section.title}>
                        <h2>{section.title}</h2>
                        {section.paragraphs.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                    </section>
                ))}
                {kind === 'privacy' && (
                    <section>
                        <h2>{copy.referencesTitle}</h2>
                        <ul className="mb-0">
                            {copy.references.map(([label, url]) => (
                                <li key={url}>
                                    <a href={url} target="_blank" rel="noreferrer">
                                        {label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                <section>
                    <h2>{copy.contactTitle}</h2>
                    <p>
                        {copy.contactText} <a href="mailto:contact@revolis.fr">contact@revolis.fr</a>.
                    </p>
                </section>
            </article>
        </>
    );
}
