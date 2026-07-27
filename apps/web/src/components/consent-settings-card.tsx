'use client';

import { useCallback, useEffect, useState } from 'react';
import { CONSENT_SCOPE_LABELS, type ConsentScope } from '@faralin/types';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@faralin/utils';

const SCOPES = Object.keys(CONSENT_SCOPE_LABELS) as ConsentScope[];

type ConsentRow = {
  scope: ConsentScope;
  revokedAt: string | null;
};

export function ConsentSettingsCard() {
  const { getToken, isSignedIn } = useAuth();
  const [consents, setConsents] = useState<ConsentRow[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSignedIn) return;
    const token = await getToken();
    const rows = await apiFetch<ConsentRow[]>('/students/me/consents', { token });
    setConsents(rows ?? []);
  }, [getToken, isSignedIn]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (scope: ConsentScope, granted: boolean) => {
    setSaving(scope);
    try {
      const token = await getToken();
      await apiFetch('/students/me/consents', {
        token,
        method: 'PATCH',
        body: JSON.stringify({ scope, granted }),
      });
      await load();
    } finally {
      setSaving(null);
    }
  };

  const granted = new Set(
    consents.filter((c) => !c.revokedAt).map((c) => c.scope),
  );

  return (
    <section className="dashboard-consent-card">
      <h2 className="dashboard-section-title">Sharing preferences</h2>
      <p className="text-muted">
        Control what partner universities can see at each application stage.
      </p>
      <ul className="dashboard-consent-list">
        {SCOPES.map((scope) => {
          const on = granted.has(scope);
          return (
            <li key={scope}>
              <label>
                <input
                  type="checkbox"
                  checked={on}
                  disabled={saving === scope}
                  onChange={(e) => void toggle(scope, e.target.checked)}
                />
                {CONSENT_SCOPE_LABELS[scope]}
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
