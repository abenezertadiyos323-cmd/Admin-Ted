export type BackendStatus = 'Connected' | 'Disconnected';
export type BackendEnvironment = 'DEV' | 'PROD';

export interface BackendInfo {
  status: BackendStatus;
  label: string | null;
  hostname: string | null;
  raw: string;
  environment: BackendEnvironment;
}

const DEPLOYMENT_LABEL_RE = /^(dev:)?([a-z0-9-]+)$/i;

const shortenHostname = (hostname: string): string => {
  const firstSegment = hostname.split('.')[0];
  return firstSegment || hostname;
};

const detectEnvironment = (hostname: string | null): BackendEnvironment => {
  if (hostname?.startsWith('dev:')) {
    return 'DEV';
  }
  if (import.meta.env.DEV) {
    return 'DEV';
  }
  return 'PROD';
};

export function getBackendInfo(convexUrl: string): BackendInfo {
  const raw = convexUrl.trim();
  if (!raw) {
    return {
      status: 'Disconnected',
      label: null,
      hostname: null,
      raw,
      environment: detectEnvironment(null),
    };
  }

  try {
    const parsed = new URL(raw);
    const hostname = parsed.hostname || null;
    return {
      status: 'Connected',
      label: hostname ? shortenHostname(hostname) : null,
      hostname,
      raw,
      environment: detectEnvironment(hostname),
    };
  } catch {
    const normalized = raw.replace(/^https?:\/\//i, '').split('/')[0];
    if (!normalized) {
      return {
        status: 'Disconnected',
        label: null,
        hostname: null,
        raw,
        environment: detectEnvironment(null),
      };
    }

    const match = normalized.match(DEPLOYMENT_LABEL_RE);
    const label = match ? `${match[1] ?? ''}${match[2]}` : normalized;
    return {
      status: 'Connected',
      label,
      hostname: normalized,
      raw,
      environment: detectEnvironment(normalized),
    };
  }
}
