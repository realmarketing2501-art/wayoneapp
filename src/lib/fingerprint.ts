// Lightweight browser fingerprint — no external libs
export interface DeviceFingerprint {
  os: string;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  screen: string;
  language: string;
  timezone: string;
  fingerprint_hash: string;
}

function detectOS(ua: string): string {
  if (/Windows NT/i.test(ua)) return 'Windows';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown';
}

function detectDevice(ua: string): DeviceFingerprint['device_type'] {
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobile|Android|iPhone/i.test(ua)) return 'mobile';
  if (typeof window !== 'undefined' && window.innerWidth < 768) return 'mobile';
  return 'desktop';
}

async function sha256(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function canvasFp(): string {
  try {
    const c = document.createElement('canvas');
    c.width = 200;
    c.height = 50;
    const ctx = c.getContext('2d');
    if (!ctx) return 'no-canvas';
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#069';
    ctx.fillText('USDT-fp-🔒', 2, 2);
    ctx.strokeStyle = '#f60';
    ctx.strokeRect(0, 0, 50, 30);
    return c.toDataURL().slice(-80);
  } catch {
    return 'canvas-err';
  }
}

export async function computeFingerprint(): Promise<DeviceFingerprint> {
  const ua = navigator.userAgent;
  const os = detectOS(ua);
  const device_type = detectDevice(ua);
  const screen = `${window.screen.width}x${window.screen.height}@${window.devicePixelRatio}`;
  const language = navigator.language ?? 'unknown';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'unknown';
  const cores = (navigator as any).hardwareConcurrency ?? 0;
  const mem = (navigator as any).deviceMemory ?? 0;
  const platform = (navigator as any).platform ?? '';
  const canvas = canvasFp();

  const raw = [ua, os, device_type, screen, language, timezone, cores, mem, platform, canvas].join('|');
  const fingerprint_hash = await sha256(raw);

  return { os, device_type, screen, language, timezone, fingerprint_hash };
}
