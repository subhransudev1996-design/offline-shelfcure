import { randomBytes } from "crypto";

function randomSegment(length: number): string {
  return randomBytes(length)
    .toString("hex")
    .toUpperCase()
    .slice(0, length);
}

export function generateLicenseKey(): string {
  return `SC-${randomSegment(4)}-${randomSegment(4)}-${randomSegment(4)}-${randomSegment(4)}`;
}

export function generateTrialKey(): string {
  return `SC-TRIAL-${randomSegment(4)}-${randomSegment(4)}`;
}

export function isValidLicenseFormat(key: string): boolean {
  return /^SC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key);
}

export function isValidTrialKeyFormat(key: string): boolean {
  return /^SC-TRIAL-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key);
}
