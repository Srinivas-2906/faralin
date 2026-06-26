'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@faralin/utils';
import { MAX_UNIVERSITY_SELECTIONS } from '@faralin/types';
import {
  Alert,
  Button,
  Skeleton,
  StepIndicator,
} from '@faralin/ui';
import { OnboardingSubjectCard } from '@/components/onboarding-subject-card';
import { UniversityCard } from '@/components/university-card';
import { getSubjectMeta } from '@/lib/subject-meta';

interface Subject {
  id: string;
  name: string;
  slug: string;
}

interface University {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  logoUrl?: string | null;
}

interface StudentProfile {
  firstName?: string | null;
  lastName?: string | null;
  schoolName?: string | null;
  yearGroup?: number | null;
  onboardingComplete: boolean;
  subjects: { subjectId: string }[];
  universitySelections: { universityId: string }[];
}

const STEPS = ['About you', 'Subjects', 'Universities'] as const;

const YEAR_GROUPS = [7, 8, 9, 10, 11, 12, 13];

export function OnboardingWizard() {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [step, setStep] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [yearGroup, setYearGroup] = useState<number | ''>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace('/sign-up');
      return;
    }

    async function load() {
      try {
        const token = await getToken();
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

        const [profile, subjectsData, unisData] = await Promise.all([
          apiFetch<StudentProfile>('/students/me', { token: token ?? undefined }),
          fetch(`${apiBase}/api/content/subjects`).then((r) => r.json()),
          apiFetch<University[]>('/students/universities', { token: token ?? undefined }),
        ]);

        if (profile.onboardingComplete) {
          router.replace('/dashboard');
          return;
        }

        setFirstName(profile.firstName ?? '');
        setLastName(profile.lastName ?? '');
        setSchoolName(profile.schoolName ?? '');
        setYearGroup(profile.yearGroup ?? '');
        setSelectedSubjects(profile.subjects.map((s) => s.subjectId));
        setSelectedUniversities(profile.universitySelections.map((s) => s.universityId));
        setSubjects(subjectsData);
        setUniversities(unisData);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load your profile');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [isLoaded, isSignedIn, getToken, router]);

  function toggleSubject(id: string) {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  function toggleUniversity(id: string) {
    setSelectedUniversities((prev) => {
      if (prev.includes(id)) return prev.filter((u) => u !== id);
      if (prev.length >= MAX_UNIVERSITY_SELECTIONS) return prev;
      return [...prev, id];
    });
  }

  function validateStep(currentStep: number): string | null {
    if (currentStep === 0) {
      if (!firstName.trim() || !lastName.trim()) {
        return 'Please enter your first and last name.';
      }
      if (!schoolName.trim()) {
        return 'Please enter your school name.';
      }
      if (yearGroup === '') {
        return 'Please select your year group.';
      }
    }
    if (currentStep === 1 && selectedSubjects.length === 0) {
      return 'Select at least one subject.';
    }
    if (currentStep === 2 && selectedUniversities.length === 0) {
      return 'Select at least one university.';
    }
    return null;
  }

  function handleNext() {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  function handleBack() {
    setError('');
    setStep((prev) => Math.max(prev - 1, 0));
  }

  async function handleComplete() {
    const message = validateStep(2);
    if (message) {
      setError(message);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const token = await getToken();

      await apiFetch('/students/me', {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          schoolName: schoolName.trim(),
          yearGroup: Number(yearGroup),
        }),
      });

      await apiFetch('/students/subjects/select', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ subjectIds: selectedSubjects }),
      });

      await apiFetch('/students/universities/select', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ universityIds: selectedUniversities }),
      });

      await apiFetch('/students/me', {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({ onboardingComplete: true }),
      });

      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save your profile');
    } finally {
      setSaving(false);
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="onboarding-shell">
        <div className="container-narrow onboarding-card">
          <Skeleton variant="title" />
          <Skeleton variant="text" style={{ marginTop: '1rem' }} />
          <Skeleton variant="card" height="16rem" style={{ marginTop: '2rem' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-shell">
      <div className={`container-narrow onboarding-card${step === 2 ? ' onboarding-card--wide' : ''}`}>
        <header className="onboarding-header">
          <p className="onboarding-eyebrow">Get started</p>
          <h1 className="onboarding-title">Set up your Faralin profile</h1>
          <p className="onboarding-lead">
            Tell us about yourself, then choose the subjects and universities where your recognition
            should count.
          </p>
        </header>

        <StepIndicator steps={[...STEPS]} currentStep={step} />

        {error && (
          <Alert variant="error" className="onboarding-alert">
            {error}
          </Alert>
        )}

        {step === 0 && (
          <section className="onboarding-step" aria-labelledby="onboarding-step-profile">
            <h2 id="onboarding-step-profile" className="onboarding-step-title">
              About you
            </h2>
            <p className="onboarding-step-desc">
              Basic details from your student profile. You can update these later.
            </p>
            <div className="onboarding-form">
              <div className="onboarding-form-row">
                <label className="onboarding-field">
                  <span className="onboarding-label">First name</span>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    required
                  />
                </label>
                <label className="onboarding-field">
                  <span className="onboarding-label">Last name</span>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                    required
                  />
                </label>
              </div>
              <label className="onboarding-field">
                <span className="onboarding-label">School name</span>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  autoComplete="organization"
                  required
                />
              </label>
              <label className="onboarding-field">
                <span className="onboarding-label">Year group</span>
                <select
                  value={yearGroup}
                  onChange={(e) =>
                    setYearGroup(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  required
                >
                  <option value="">Select year</option>
                  {YEAR_GROUPS.map((year) => (
                    <option key={year} value={year}>
                      Year {year}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="onboarding-step" aria-labelledby="onboarding-step-subjects">
            <h2 id="onboarding-step-subjects" className="onboarding-step-title">
              Your subjects
            </h2>
            <p className="onboarding-step-desc">
              Choose the subjects you want to earn Faralins in. Select all that apply.
            </p>
            <div className="onboarding-subject-list">
              {subjects.map((subject) => {
                const meta = getSubjectMeta(subject.slug);
                return (
                  <OnboardingSubjectCard
                    key={subject.id}
                    name={subject.name}
                    description={meta.description}
                    icon={meta.icon}
                    selected={selectedSubjects.includes(subject.id)}
                    onToggle={() => toggleSubject(subject.id)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="onboarding-step" aria-labelledby="onboarding-step-universities">
            <h2 id="onboarding-step-universities" className="onboarding-step-title">
              Your universities
            </h2>
            <p className="onboarding-step-desc">
              Pick up to {MAX_UNIVERSITY_SELECTIONS} partner universities. Faralin conversion rates
              vary by institution.
            </p>
            <p className="onboarding-count">
              {selectedUniversities.length} of {MAX_UNIVERSITY_SELECTIONS} selected
            </p>
            <div className="onboarding-university-grid">
              {universities.map((university) => (
                <UniversityCard
                  key={university.id}
                  university={university}
                  selectable
                  selected={selectedUniversities.includes(university.id)}
                  onToggle={() => toggleUniversity(university.id)}
                />
              ))}
            </div>
          </section>
        )}

        <div className="onboarding-actions">
          {step > 0 ? (
            <Button variant="secondary" onClick={handleBack} disabled={saving}>
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <Button variant="primary" onClick={handleNext}>
              Continue
            </Button>
          ) : (
            <Button variant="copper" loading={saving} onClick={handleComplete}>
              Complete setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
