import { useSiteCopy } from '../../lib/i18n';
import { PageTitle } from '../../components/UI';

export function AboutPage() {
    const copy = useSiteCopy();
    return (
        <div className="container">
            <PageTitle title={copy.footer.about} description={copy.about.description} />
            <section className="card card-body p-4 about-content">
                <h2>{copy.about.statusTitle}</h2>
                <p>{copy.about.status}</p>
                <h2>{copy.about.privacyTitle}</h2>
                <p>{copy.about.privacy}</p>
                <h2>{copy.about.creditsTitle}</h2>
                <ul>
                    <li>
                        {copy.about.bootstrap} <a href="/licenses/bootstrap.txt">{copy.market.license}</a>
                    </li>
                    <li>
                        {copy.about.marked} <a href="/licenses/marked.txt">{copy.market.license}</a>
                    </li>
                    <li>
                        {copy.about.octicons} <a href="/licenses/octicons.txt">{copy.market.license}</a>
                    </li>
                    <li>
                        {copy.about.qrcode} <a href="/licenses/qrcode.txt">{copy.market.license}</a>
                    </li>
                    <li>
                        {copy.about.ipaddr} <a href="/licenses/ipaddr.txt">{copy.market.license}</a>
                    </li>
                    <li>
                        {copy.about.font} <a href="/assets/fonts/lato/LICENSE.txt">{copy.market.license}</a>
                    </li>
                </ul>
            </section>
        </div>
    );
}
