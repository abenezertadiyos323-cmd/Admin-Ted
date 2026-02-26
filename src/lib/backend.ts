export type BackendStatus = 'Connected' | 'Disconnected';

export interface BackendInfo {
  status: BackendStatus;
  label: string | null;
  hostname: string | null;
  raw: string;
}

const DEPLOYMENT_LABEL_RE = /^(dev:)?([a-z0-9-]+)$/i;

const shortenHostname = (hostname: string): string => {
  const firstSegment = hostname.split('.')[0];
  return firstSegment || hostname;
};

export function getBackendInfo(convexUrl: string): BackendInfo {
  const raw = convexUrl.trim();
  if (!raw) {
    return {
      status: 'Disconnected',
      label: null,
      hostname: null,
      raw,
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
    };
  } catch {
    const normalized = raw.replace(/^https?:\/\//i, '').split('/')[0];
    if (!normalized) {
      return {
        status: 'Disconnected',
        label: null,
        hostname: null,
        raw,
      };
    }

    const match = normalized.match(DEPLOYMENT_LABEL_RE);
    const label = match ? `${match[1] ?? ''}${match[2]}` : normalized;
    return {
      status: 'Connected',
      label,
      hostname: normalized,
      raw,
    };
  }
}
