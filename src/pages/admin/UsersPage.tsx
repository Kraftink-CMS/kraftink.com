import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FormEvent } from 'react';
import { accountCopy } from '../../lib/translations';
import { api, ApiError } from '../../lib/api';
import { useLocale } from '../../lib/i18n';
import { useSession } from '../../lib/session';
import { Card, Empty, ErrorNotice, TableLoading, PageTitle } from '../../components/UI';
import { Select } from '../../components/Select';
import { Modal } from '../../components/Modal';
import { SensitiveButton } from '../../components/auth/SensitiveButton';
import type { Role } from '../../../shared/auth';
import { normalizeNetwork, type IpPolicy } from '../../../shared/ip';
import { maxArchiveBytes } from '../../../shared/packages/zip';

interface ManagedUser {
    id: string;
    email: string;
    username: string;
    role: Role | null;
    emailVerified: boolean;
    banned: boolean;
    banReason: string | null;
    allowedIps: string[];
    ipLimit: number;
    ipPolicy: IpPolicy;
    allowedNetworks: string[];
    maxUploadBytes: number | null;
}

export function AdminUsersPage() {
    const { locale } = useLocale();
    const copy = accountCopy[locale];
    const { user, sensitive, confirming } = useSession();
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [search, setSearch] = useSearchParams();
    const submittedQuery = (search.get('q') ?? '').slice(0, 100);
    const requestedOffset = Number(search.get('offset') ?? 0);
    const offset = Number.isSafeInteger(requestedOffset) && requestedOffset >= 0 ? requestedOffset : 0;
    const [nextOffset, setNextOffset] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<unknown>(null);
    const [notice, setNotice] = useState('');
    const [selected, setSelected] = useState<ManagedUser | null>(null);
    const [role, setRole] = useState<Role | null>(null);
    const [banned, setBanned] = useState(false);
    const [banReason, setBanReason] = useState('');
    const [ipPolicy, setIpPolicy] = useState<IpPolicy>('addresses');
    const [ipLimit, setIpLimit] = useState('1');
    const [allowedNetworks, setAllowedNetworks] = useState('');
    const [maxUploadMiB, setMaxUploadMiB] = useState('');
    const [defaultMaxUploadBytes, setDefaultMaxUploadBytes] = useState(25 * 1024 * 1024);

    const load = useCallback(
        async (signal?: AbortSignal) => {
            setLoading(true);
            try {
                const data = await api<{
                    users: ManagedUser[];
                    nextOffset: number | null;
                    defaultMaxUploadBytes: number;
                }>(`/api/admin/users?q=${encodeURIComponent(submittedQuery)}&offset=${offset}`, { signal });
                if (signal?.aborted) {
                    return;
                }
                setUsers(data.users);
                setNextOffset(data.nextOffset);
                setDefaultMaxUploadBytes(data.defaultMaxUploadBytes);
            } finally {
                if (!signal?.aborted) {
                    setLoading(false);
                }
            }
        },
        [offset, submittedQuery],
    );

    useEffect(() => {
        const controller = new AbortController();
        void load(controller.signal).catch((failure) => {
            if (!controller.signal.aborted) {
                setError(failure);
            }
        });
        return () => controller.abort();
    }, [load]);

    function page(offset: number) {
        const next = new URLSearchParams(search);
        if (offset) {
            next.set('offset', String(offset));
        } else {
            next.delete('offset');
        }
        setSearch(next);
    }

    function close() {
        setSelected(null);
    }

    function edit(target: ManagedUser) {
        setSelected(target);
        setRole(target.role);
        setBanned(target.banned);
        setBanReason(target.banReason ?? '');
        setIpPolicy(target.ipPolicy);
        setIpLimit(String(target.ipLimit));
        setAllowedNetworks(target.allowedNetworks.join('\n'));
        setMaxUploadMiB(target.maxUploadBytes === null ? '' : String(target.maxUploadBytes / 1024 / 1024));
        setError(null);
    }

    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selected) {
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const maxUploadBytes = maxUploadMiB.trim() === '' ? null : Math.round(Number(maxUploadMiB) * 1024 * 1024);
            if (
                maxUploadBytes !== null &&
                (!Number.isSafeInteger(maxUploadBytes) ||
                    maxUploadBytes < 1024 * 1024 ||
                    maxUploadBytes > maxArchiveBytes)
            ) {
                throw new ApiError('upload_limit_invalid', 422);
            }
            let ipChanges: { ipPolicy?: IpPolicy; ipLimit?: number; allowedNetworks?: string[] } = {};
            if (ipPolicy === 'networks') {
                const networks = allowedNetworks
                    .split('\n')
                    .map((value) => value.trim())
                    .filter(Boolean)
                    .map(normalizeNetwork);
                if (networks.length === 0 || networks.some((network) => network === null)) {
                    throw new ApiError('ip_networks_invalid', 422);
                }
                const canonicalNetworks = [...new Set(networks.filter((network) => network !== null))];
                if (
                    ipPolicy !== selected.ipPolicy ||
                    JSON.stringify(canonicalNetworks) !== JSON.stringify(selected.allowedNetworks)
                ) {
                    ipChanges = { ipPolicy, allowedNetworks: canonicalNetworks };
                }
            } else if (ipPolicy !== selected.ipPolicy || Number(ipLimit) !== selected.ipLimit) {
                ipChanges = { ipPolicy, ipLimit: Number(ipLimit) };
            }
            const changes = {
                ...(role !== selected.role ? { role } : {}),
                ...(banned !== selected.banned ? { banned, ...(banned ? { banReason } : {}) } : {}),
                ...ipChanges,
                ...(maxUploadBytes !== selected.maxUploadBytes ? { maxUploadBytes } : {}),
            };
            if (Object.keys(changes).length === 0) {
                close();
                return;
            }
            await api(`/api/admin/users/${encodeURIComponent(selected.id)}`, {
                method: 'PATCH',
                sensitiveToken: await sensitive(role !== selected.role ? 'admin.roles' : 'admin.users'),
                json: changes,
            });
            close();
            setNotice(copy.userSaved);
            await load();
        } catch (failure) {
            setError(failure);
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            <PageTitle title={copy.users} description={copy.usersDescription} />
            {!selected && <ErrorNotice error={error} />}
            {notice && (
                <div className="alert alert-success" role="status">
                    {notice}
                </div>
            )}
            <Card
                footer={
                    <div className="d-flex justify-content-between gap-2">
                        <button
                            className="btn btn-outline-secondary"
                            type="button"
                            disabled={loading || offset === 0}
                            onClick={() => page(Math.max(offset - 50, 0))}
                        >
                            {copy.previous}
                        </button>
                        <button
                            className="btn btn-outline-secondary"
                            type="button"
                            disabled={loading || nextOffset === null}
                            onClick={() => page(nextOffset!)}
                        >
                            {copy.next}
                        </button>
                    </div>
                }
            >
                <form
                    className="row g-2 mb-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        const query = String(new FormData(event.currentTarget).get('q') ?? '').trim();
                        if (query === submittedQuery && offset === 0) {
                            void load().catch(setError);
                        } else {
                            setSearch(query ? { q: query } : {});
                        }
                    }}
                >
                    <div className="col">
                        <label className="visually-hidden" htmlFor="user-search">
                            {copy.search}
                        </label>
                        <input
                            id="user-search"
                            className="form-control"
                            name="q"
                            key={submittedQuery}
                            defaultValue={submittedQuery}
                            maxLength={100}
                            placeholder={copy.search}
                        />
                    </div>
                    <div className="col-auto">
                        <button className="btn btn-outline-secondary" type="submit">
                            {copy.searchAction}
                        </button>
                    </div>
                </form>
                {loading && users.length === 0 ? (
                    <TableLoading columns={[copy.user, copy.role, copy.ipTitle, copy.status, copy.manage]} />
                ) : users.length === 0 ? (
                    <Empty>{copy.noUsers}</Empty>
                ) : (
                    <div className="table-responsive">
                        <table className="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th scope="col">{copy.user}</th>
                                    <th scope="col">{copy.role}</th>
                                    <th scope="col">{copy.ipTitle}</th>
                                    <th scope="col">{copy.status}</th>
                                    <th scope="col" className="text-end">
                                        {copy.manage}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((target) => (
                                    <tr key={target.id}>
                                        <td>
                                            {target.username}
                                            <br />
                                            <span className="small text-body-secondary">{target.email}</span>
                                        </td>
                                        <td>
                                            <span className="badge text-bg-secondary">
                                                {copy[target.role ?? 'user']}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="vstack gap-1">
                                                <span className="small text-body-secondary">
                                                    {target.ipPolicy === 'networks'
                                                        ? copy.ipModeNetworks
                                                        : copy.ipModeAddresses}
                                                </span>
                                                {(target.ipPolicy === 'networks'
                                                    ? target.allowedNetworks
                                                    : target.allowedIps
                                                ).length > 0 ? (
                                                    (target.ipPolicy === 'networks'
                                                        ? target.allowedNetworks
                                                        : target.allowedIps
                                                    ).map((ip) => (
                                                        <code key={ip} className="text-break">
                                                            {ip}
                                                        </code>
                                                    ))
                                                ) : (
                                                    <span>{copy.neverConfigured}</span>
                                                )}
                                            </div>
                                            {target.ipPolicy === 'addresses' && (
                                                <small className="text-body-secondary">
                                                    {copy.ipLimitLabel}: {target.ipLimit}
                                                </small>
                                            )}
                                        </td>
                                        <td>{target.banned ? copy.banned : copy.active}</td>
                                        <td className="text-end">
                                            <button
                                                className="btn btn-sm btn-outline-secondary"
                                                type="button"
                                                onClick={() => edit(target)}
                                            >
                                                {copy.manage}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
            <Modal
                open={Boolean(selected) && !confirming}
                onClose={close}
                labelledBy="manage-user-title"
                dismissible={!busy}
                size="lg"
            >
                {selected && (
                    <form onSubmit={save} className="modal-content">
                        <div className="modal-body p-4">
                            <h2 className="h4" id="manage-user-title">
                                {copy.manageUser}
                            </h2>
                            <p>
                                {selected.username}
                                <br />
                                <span className="text-body-secondary">{selected.email}</span>
                            </p>
                            <ErrorNotice error={error} />
                            <div className="mb-3">
                                <label className="form-label" htmlFor="user-role">
                                    {copy.role}
                                </label>
                                <Select
                                    id="user-role"
                                    className="form-select"
                                    value={role ?? ''}
                                    disabled={selected.id === user?.id}
                                    onChange={(event) =>
                                        setRole(event.target.value === '' ? null : (event.target.value as Role))
                                    }
                                >
                                    <option value="">{copy.user}</option>
                                    {(['creator', 'moderator', 'admin'] as const).map((value) => (
                                        <option key={value} value={value}>
                                            {copy[value]}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <div className="form-check mb-2">
                                <input
                                    className="form-check-input"
                                    id="user-banned"
                                    type="checkbox"
                                    checked={banned}
                                    disabled={selected.id === user?.id}
                                    onChange={(event) => setBanned(event.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="user-banned">
                                    {copy.banAccount}
                                </label>
                            </div>
                            <p className="form-text">{copy.banHelp}</p>
                            {banned && !selected.banned && (
                                <div className="mb-3">
                                    <label className="form-label" htmlFor="ban-reason">
                                        {copy.banReason}
                                    </label>
                                    <textarea
                                        className="form-control"
                                        id="ban-reason"
                                        value={banReason}
                                        onChange={(event) => setBanReason(event.target.value)}
                                        minLength={8}
                                        maxLength={1000}
                                        required
                                    />
                                </div>
                            )}
                            <fieldset className="mb-3">
                                <legend className="fs-6">{copy.ipModeLabel}</legend>
                                <div className="vstack gap-2">
                                    {(['addresses', 'networks'] as const).map((value) => (
                                        <div className="form-check border rounded-3 p-3 ps-5" key={value}>
                                            <input
                                                id={`user-ip-policy-${value}`}
                                                className="form-check-input"
                                                type="radio"
                                                name="user-ip-policy"
                                                value={value}
                                                checked={ipPolicy === value}
                                                onChange={() => setIpPolicy(value)}
                                            />
                                            <label
                                                className="form-check-label fw-semibold"
                                                htmlFor={`user-ip-policy-${value}`}
                                            >
                                                {value === 'addresses' ? copy.ipModeAddresses : copy.ipModeNetworks}
                                            </label>
                                            <p className="small text-body-secondary mb-0">
                                                {value === 'addresses'
                                                    ? copy.ipAddressesModeHelp
                                                    : copy.ipNetworksModeHelp}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </fieldset>
                            {ipPolicy === 'addresses' ? (
                                <div className="mb-3">
                                    <label className="form-label" htmlFor="user-ip-limit">
                                        {copy.ipLimitLabel}
                                    </label>
                                    <input
                                        id="user-ip-limit"
                                        className="form-control"
                                        type="number"
                                        min={Math.max(1, selected.allowedIps.length)}
                                        max="100"
                                        step="1"
                                        value={ipLimit}
                                        onChange={(event) => setIpLimit(event.target.value)}
                                        required
                                    />
                                    <p className="form-text">{copy.adminIpLimitHelp}</p>
                                </div>
                            ) : (
                                <div className="mb-3">
                                    <label className="form-label" htmlFor="user-ip-networks">
                                        {copy.ipNetworksTitle}
                                    </label>
                                    <textarea
                                        id="user-ip-networks"
                                        className="form-control font-monospace"
                                        value={allowedNetworks}
                                        onChange={(event) => setAllowedNetworks(event.target.value)}
                                        rows={4}
                                        maxLength={10000}
                                        spellCheck={false}
                                        autoComplete="off"
                                        required
                                    />
                                    <p className="form-text">{copy.adminIpNetworksHelp}</p>
                                </div>
                            )}
                            <div className="mb-3">
                                <label className="form-label" htmlFor="user-upload-limit">
                                    {copy.uploadLimitLabel}
                                </label>
                                <input
                                    id="user-upload-limit"
                                    className="form-control"
                                    type="number"
                                    min="1"
                                    max={maxArchiveBytes / 1024 / 1024}
                                    step="any"
                                    value={maxUploadMiB}
                                    onChange={(event) => setMaxUploadMiB(event.target.value)}
                                    placeholder={String(defaultMaxUploadBytes / 1024 / 1024)}
                                />
                                <p className="form-text">
                                    {copy.adminUploadLimitHelp.replace(
                                        '{size}',
                                        new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
                                            defaultMaxUploadBytes / 1024 / 1024,
                                        ),
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline-secondary" type="button" disabled={busy} onClick={close}>
                                {copy.cancel}
                            </button>
                            <SensitiveButton className="btn btn-primary" type="submit" disabled={busy}>
                                {busy ? copy.loading : copy.save}
                            </SensitiveButton>
                        </div>
                    </form>
                )}
            </Modal>
        </>
    );
}
