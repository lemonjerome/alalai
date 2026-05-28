'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

// Static symptom → specialization mapping
const SYMPTOM_MAP: Record<string, string[]> = {
  'chest pain': ['Cardiology', 'Internal Medicine'],
  'heart palpitations': ['Cardiology'],
  'shortness of breath': ['Pulmonology', 'Cardiology'],
  'persistent cough': ['Pulmonology', 'ENT'],
  'skin rash': ['Dermatology'],
  'acne': ['Dermatology'],
  'hair loss': ['Dermatology'],
  'headache': ['Neurology', 'Internal Medicine'],
  'dizziness': ['Neurology', 'ENT'],
  'back pain': ['Orthopedics', 'Internal Medicine'],
  'joint pain': ['Orthopedics', 'Rheumatology'],
  'fever': ['Internal Medicine', 'Infectious Disease'],
  'stomach pain': ['Gastroenterology', 'Internal Medicine'],
  'nausea': ['Gastroenterology', 'Internal Medicine'],
  'eye problems': ['Ophthalmology'],
  'blurred vision': ['Ophthalmology', 'Neurology'],
  'ear pain': ['ENT'],
  'runny nose': ['ENT', 'Allergy'],
  'anxiety': ['Psychiatry', 'Psychology'],
  'depression': ['Psychiatry', 'Psychology'],
  'weight gain': ['Endocrinology', 'Internal Medicine'],
  'fatigue': ['Internal Medicine', 'Endocrinology'],
  'diabetes symptoms': ['Endocrinology'],
  "women's health": ['OB-GYN'],
  'pregnancy': ['OB-GYN'],
  'urinary problems': ['Urology'],
  'dental pain': ['Dentistry'],
};

const ALL_SYMPTOMS = Object.keys(SYMPTOM_MAP).sort();

interface SymptomCheckerProps {
  onSpecializations?: (specs: string[]) => void;
}

export function SymptomChecker({ onSpecializations }: SymptomCheckerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<string[] | null>(null);

  function toggle(symptom: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(symptom)) {
        next.delete(symptom);
      } else {
        next.add(symptom);
      }
      return next;
    });
    setResults(null);
  }

  function getRecommendations() {
    if (selected.size === 0) return;
    const specSet = new Set<string>();
    for (const symptom of selected) {
      const specs = SYMPTOM_MAP[symptom] ?? [];
      specs.forEach((s) => specSet.add(s));
    }
    const sorted = [...specSet].sort();
    setResults(sorted);
    onSpecializations?.(sorted);
  }

  function reset() {
    setSelected(new Set());
    setResults(null);
    onSpecializations?.([]);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">
          Select your symptoms:
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_SYMPTOMS.map((symptom) => (
            <button
              key={symptom}
              type="button"
              onClick={() => toggle(symptom)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm border transition-colors capitalize',
                selected.has(symptom)
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-sky-400 hover:text-sky-600'
              )}
            >
              {symptom}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={getRecommendations}
          disabled={selected.size === 0}
        >
          Get Recommendation
        </Button>
        {selected.size > 0 && (
          <Button variant="outline" onClick={reset}>
            Clear
          </Button>
        )}
      </div>

      {results !== null && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-3">
          {results.length === 0 ? (
            <p className="text-sm text-sky-700">
              No specific specialization match found. Consider seeing a General Practitioner / Internal Medicine doctor.
            </p>
          ) : (
            <>
              <p className="text-sm font-semibold text-sky-800">
                Recommended specializations for your symptoms:
              </p>
              <div className="flex flex-wrap gap-2">
                {results.map((spec) => (
                  <Badge
                    key={spec}
                    className="bg-sky-100 text-sky-800 border-sky-200"
                  >
                    {spec}
                  </Badge>
                ))}
              </div>
              <Link
                href={`/doctors?specialization=${encodeURIComponent(results[0])}`}
                className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'inline-flex items-center gap-1.5')}
              >
                <Stethoscope className="h-3.5 w-3.5" />
                Browse {results[0]} doctors
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
