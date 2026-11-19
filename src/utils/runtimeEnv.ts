export function hasEmbeddedSnapshot(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.__AETHER_EMBEDDED_DATA__ !== 'undefined'
  );
}

export function isStaticOnlyHost(): boolean {
  if (typeof window === 'undefined') return false;
  const { protocol, hostname } = window.location;
  return protocol === 'file:' || hostname.endsWith('.github.io');
}

export function shouldUseBackendApi(): boolean {
  return !hasEmbeddedSnapshot() && !isStaticOnlyHost();
}
