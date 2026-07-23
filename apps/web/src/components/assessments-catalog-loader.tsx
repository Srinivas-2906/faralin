'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { apiFetch } from '@faralin/utils';
import { AssessmentsCatalog, type AssessmentListItem } from '@/components/assessments-catalog';

export function AssessmentsCatalogLoader({
  initialAssessments,
}: {
  initialAssessments: AssessmentListItem[];
}) {
  const { isSignedIn, getToken } = useAuth();
  const [assessments, setAssessments] = useState(initialAssessments);

  useEffect(() => {
    if (!isSignedIn) {
      setAssessments(initialAssessments);
      return;
    }

    (async () => {
      try {
        const token = await getToken();
        const data = await apiFetch<AssessmentListItem[]>('/assessments/catalog/me', {
          token: token ?? undefined,
        });
        if (data?.length) setAssessments(data);
      } catch {
        setAssessments(initialAssessments);
      }
    })();
  }, [isSignedIn, getToken, initialAssessments]);

  return <AssessmentsCatalog assessments={assessments} />;
}
