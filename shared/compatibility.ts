function object(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function unicode(value: string): boolean {
    return !/[\uD800-\uDFFF]/u.test(value);
}

export function normalizedVersion(value: unknown): string | null {
    if (typeof value !== 'string' || !value.trim() || value.length > 200 || !unicode(value)) {
        return null;
    }
    let version = value.trim().replace(/@(?:stable|RC|beta|alpha|dev)$/i, '');
    if (/^dev-[^\s,]+$/i.test(version)) {
        return `dev-${version.slice(4)}`;
    }
    version = version.replace(/\+[^\s]+$/, '');
    const match =
        /^v?(\d{1,5})(\.\d+)?(\.\d+)?(\.\d+)?[._-]?(?:(stable|beta|b|RC|alpha|a|patch|pl|p)((?:[.-]?\d+)*)?)?([.-]?dev)?$/i.exec(
            version,
        );
    if (!match) {
        return null;
    }
    const stability = match[5]?.toLowerCase();
    const expanded =
        stability === 'a'
            ? 'alpha'
            : stability === 'b'
              ? 'beta'
              : stability === 'p' || stability === 'pl'
                ? 'patch'
                : stability;
    const base = `${match[1]}${match[2] ?? '.0'}${match[3] ?? '.0'}${match[4] ?? '.0'}`;
    return match[5] === 'stable'
        ? base
        : `${base}${expanded ? `-${expanded}${(match[6] ?? '').replace(/^[.-]+/, '')}` : ''}${match[7] ? '-dev' : ''}`;
}

export function constraint(value: unknown): boolean {
    if (typeof value !== 'string' || !value.trim() || value.length > 200 || /[\x00-\x1f\x7f]/.test(value)) {
        return false;
    }
    const token =
        /^(?:~|\^|<=|>=|==|!=|<>|<|>|=)?(?:v?\d+(?:\.(?:\d+|[xX*])){0,3}|[xX*]|dev-[A-Za-z0-9_.\/-]+)(?:[._-]?(?:(?:stable|beta|b|RC|alpha|a|patch|pl|p)(?:[.-]?\d+)*)?(?:[.-]?dev)?)?(?:\+[A-Za-z0-9.-]+)?(?:@(?:stable|RC|beta|alpha|dev))?$/i;
    return value
        .trim()
        .replace(/([~^<>=!]{1,2})\s+/g, '$1')
        .split(/\s*\|\|?\s*/)
        .every((group) => {
            const range = group.split(/\s+-\s+/);
            if (
                range.length > 2 ||
                (range.length === 2 && !range.every((part) => /^v?\d+(?:\.\d+){0,3}$/.test(part)))
            ) {
                return false;
            }
            return range
                .join(' ')
                .split(/[\s,]+/)
                .every((part) => {
                    if (!token.test(part)) {
                        return false;
                    }
                    const operator = /^(~|\^|<=|>=|==|!=|<>|<|>|=)/.exec(part)?.[1] ?? '';
                    const version = part.slice(operator.length);
                    if (/(?:^|\.)[xX*](?:\.|@|$)/.test(version.replace(/\+[^@]+/, ''))) {
                        return (
                            !operator &&
                            /^(?:v?\d+(?:\.(?:\d+|[xX*])){0,3}|[xX*])(?:@(?:stable|RC|beta|alpha|dev))?$/i.test(
                                version,
                            ) &&
                            !/[xX*]\.\d/.test(version)
                        );
                    }
                    return (
                        normalizedVersion(version) !== null &&
                        !(['~', '^'].includes(operator) && /^dev-/i.test(version))
                    );
                });
        });
}

export function requirements(value: unknown): boolean {
    if (!object(value) || typeof value.cms !== 'string' || typeof value.php !== 'string') {
        return false;
    }
    const slugs = new Set<string>();
    return Object.entries(value).every(([reference, value]) => {
        if (!['cms', 'php'].includes(reference)) {
            const identity = /^(plugin|theme|game):([a-z][a-z0-9-]{1,49})$/.exec(reference);
            if (!identity || slugs.has(identity[2])) {
                return false;
            }
            slugs.add(identity[2]);
        }
        return constraint(value);
    });
}
