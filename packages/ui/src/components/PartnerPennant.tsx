import { useId } from 'react';

export function PartnerPennant() {
  const gradientId = useId();

  return (
    <svg viewBox="0 0 16 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="8" y1="0" x2="8" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--faralin-crimson)" />
          <stop offset="1" stopColor="var(--faralin-crimson-hover)" />
        </linearGradient>
      </defs>
      <path
        d="M1 0h14v20.5L8 26 1 20.5V0Z"
        fill={`url(#${gradientId})`}
        stroke="var(--faralin-copper)"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}
