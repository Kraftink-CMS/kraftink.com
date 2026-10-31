import { Card, Loading, Skeleton, TableLoading } from '../../components/UI';
import { useLocale } from '../../lib/i18n';
import { accountCopy } from '../../lib/translations';

function DetailsLoading({ labels }: { labels: string[] }) {
    return (
        <Loading>
            <dl className="row mb-0">
                {labels.map((label) => (
                    <Fragment key={label}>
                        <dt className="col-5">{label}</dt>
                        <dd className="col-7">
                            <Skeleton height="1.5rem" />
                        </dd>
                    </Fragment>
                ))}
            </dl>
        </Loading>
    );
}

export function AccountLoading({ tab }: { tab: 'purchases' | 'orders' | 'site' | 'profile' }) {
    const { locale } = useLocale();
    const copy = accountCopy[locale];
    const button = <Skeleton width="10rem" height="2.625rem" />;

    if (tab === 'orders') {
        return (
            <Card title={copy.orders}>
                <TableLoading
                    columns={[copy.resource, copy.seller, copy.amount, copy.date, copy.status, copy.document]}
                />
            </Card>
        );
    }
    if (tab === 'purchases') {
        return (
            <div className="row g-4">
                {[0, 1].map((index) => (
                    <div className="col-12 col-lg-6" key={index}>
                        <Card title={<Skeleton width="60%" height="1.25rem" />} footer={button}>
                            <DetailsLoading labels={[copy.version, copy.status, copy.access]} />
                        </Card>
                    </div>
                ))}
            </div>
        );
    }
    if (tab === 'site') {
        return (
            <div className="row g-4">
                <div className="col-12 col-lg-6">
                    <Card title={copy.keyTitle} footer={button}>
                        <p>{copy.keyHelp}</p>
                        <Loading>
                            <Skeleton width="60%" height="1.5rem" />
                        </Loading>
                    </Card>
                </div>
                <div className="col-12 col-lg-6">
                    <Card title={copy.ipTitle} footer={button}>
                        <p>{copy.ipHelp}</p>
                        <Loading>
                            <Skeleton className="mb-3" />
                            <Skeleton width="35%" className="mb-2" />
                            <Skeleton height="2.625rem" className="mb-3" />
                            <Skeleton width="80%" />
                        </Loading>
                    </Card>
                </div>
            </div>
        );
    }
    return (
        <div className="row g-4">
            <div className="col-12 col-lg-6">
                <Card title={copy.profile} footer={button}>
                    <DetailsLoading labels={[copy.username, copy.email, copy.role, copy.createdAt]} />
                </Card>
            </div>
            <div className="col-12 col-lg-6">
                <Card title={copy.githubTitle} footer={button}>
                    <Loading>
                        <Skeleton height="1.5rem" />
                    </Loading>
                </Card>
            </div>
            {[
                [copy.usernameChangeTitle, copy.username, copy.usernameHelp],
                [copy.emailChangeTitle, copy.email, copy.emailChangeHelp],
            ].map(([title, label, help]) => (
                <div className="col-12 col-lg-6" key={title}>
                    <Card title={title} footer={button}>
                        <Loading>
                            <div className="form-label">{label}</div>
                            <Skeleton height="2.625rem" />
                            <div className="form-text">{help}</div>
                        </Loading>
                    </Card>
                </div>
            ))}
        </div>
    );
}
import { Fragment } from 'react';
