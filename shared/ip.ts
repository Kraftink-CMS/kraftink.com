import ipaddr from 'ipaddr.js';

export type IpPolicy = 'addresses' | 'networks';

export function normalizeIp(input: unknown): string | null {
    if (typeof input !== 'string' || input.length > 45 || input !== input.trim() || /[\s%/\[\]]/.test(input)) {
        return null;
    }
    if (!input.includes(':') && !ipaddr.IPv4.isValidFourPartDecimal(input)) {
        return null;
    }
    if (input.includes('.') && !ipaddr.IPv4.isValidFourPartDecimal(input.slice(input.lastIndexOf(':') + 1))) {
        return null;
    }
    try {
        return ipaddr.process(input).toString();
    } catch {
        return null;
    }
}

export function normalizeNetwork(input: unknown): string | null {
    if (typeof input !== 'string' || input.length > 49) {
        return null;
    }
    const parts = input.split('/');
    if (parts.length !== 2 || !/^[1-9]\d{0,2}$/.test(parts[1]) || normalizeIp(parts[0]) === null) {
        return null;
    }
    try {
        const parsed = ipaddr.parseCIDR(input);
        let address = parsed[0];
        let prefix = parsed[1];
        if (address instanceof ipaddr.IPv6 && address.isIPv4MappedAddress()) {
            if (prefix <= 96) {
                return null;
            }
            address = address.toIPv4Address();
            prefix -= 96;
        }
        const cidr = `${address.toString()}/${prefix}`;
        const network =
            address.kind() === 'ipv4'
                ? ipaddr.IPv4.networkAddressFromCIDR(cidr)
                : ipaddr.IPv6.networkAddressFromCIDR(cidr);
        return `${network.toString()}/${prefix}`;
    } catch {
        return null;
    }
}

export function ipMatchesPolicy(
    input: unknown,
    policy: {
        ipPolicy: unknown;
        allowedIps: unknown;
        allowedNetworks: unknown;
        ipLimit: unknown;
    },
): boolean {
    const ip = normalizeIp(input);
    if (
        !ip ||
        !Array.isArray(policy.allowedIps) ||
        !Array.isArray(policy.allowedNetworks) ||
        !Number.isSafeInteger(policy.ipLimit) ||
        (policy.ipLimit as number) < 1 ||
        (policy.ipLimit as number) > 100
    ) {
        return false;
    }
    if (policy.ipPolicy === 'addresses') {
        if (
            policy.allowedNetworks.length !== 0 ||
            policy.allowedIps.length > (policy.ipLimit as number) ||
            new Set(policy.allowedIps).size !== policy.allowedIps.length ||
            policy.allowedIps.some((address) => typeof address !== 'string' || normalizeIp(address) !== address)
        ) {
            return false;
        }
        return policy.allowedIps.includes(ip);
    }
    if (
        policy.ipPolicy !== 'networks' ||
        policy.allowedIps.length !== 0 ||
        policy.ipLimit !== 1 ||
        policy.allowedNetworks.length === 0 ||
        policy.allowedNetworks.length > 100 ||
        new Set(policy.allowedNetworks).size !== policy.allowedNetworks.length ||
        policy.allowedNetworks.some((network) => typeof network !== 'string' || normalizeNetwork(network) !== network)
    ) {
        return false;
    }
    const address = ipaddr.parse(ip);
    return policy.allowedNetworks.some((network) => {
        const subnet = ipaddr.parseCIDR(network as string);
        return address.kind() === subnet[0].kind() && address.match(subnet);
    });
}
