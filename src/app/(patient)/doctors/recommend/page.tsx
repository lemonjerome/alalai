'use client';

import { SymptomChecker } from '@/components/doctors/SymptomChecker';
import { Badge } from '@/components/ui/badge';
import { Sparkles, FlaskConical } from 'lucide-react';

export default function DoctorRecommendPage() {

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Find by Symptoms</h1>
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
            Beta
          </Badge>
        </div>
        <p className="text-sm text-gray-500">
          Tell us what you&apos;re experiencing and we&apos;ll suggest the right specialization to see.
        </p>
      </div>

      {/* AI Coming Soon Banner */}
      <div className="rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 p-4 mb-6 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-sky-800">AI-Powered Recommendations — Coming Soon</p>
          <p className="text-sm text-sky-700 mt-0.5">
            We&apos;re integrating an AI system to analyze your symptoms and provide personalized doctor recommendations.
            In the meantime, use the symptom checker below to find the right specialization.
          </p>
        </div>
      </div>

      {/* Static Symptom Checker */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">Symptom Checker</h2>
          <span className="text-xs text-gray-400">(static mapping — not AI)</span>
        </div>

        <SymptomChecker />
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-400 mt-4 text-center">
        This tool provides general guidance only. For emergencies, contact emergency services immediately.
        Always consult a qualified medical professional for a proper diagnosis.
      </p>
    </div>
  );
}
