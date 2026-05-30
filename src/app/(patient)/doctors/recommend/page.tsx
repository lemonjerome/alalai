import { SymptomChecker } from '@/components/doctors/SymptomChecker';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'AI Doctor Recommendation | AlalAI',
  description: 'Describe your symptoms and get matched to the right specialist.',
};

export default function DoctorRecommendPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Find by Symptoms</h1>
          <Badge className="bg-sky-100 text-sky-700 border-sky-200 text-xs gap-1">
            <Sparkles className="h-3 w-3" />
            AI-Powered
          </Badge>
        </div>
        <p className="text-sm text-gray-500">
          Describe what you&apos;re feeling in plain language and our AI will match you to the right
          specialist — then book a consultation instantly.
        </p>
      </div>

      {/* Main checker */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <SymptomChecker />
      </div>

      {/* Disclaimer */}
      <div className="mt-4 flex items-start gap-2 text-xs text-gray-400">
        <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p>
          This tool provides general guidance only and is not a substitute for professional medical
          advice. For emergencies, call 911 or go to the nearest emergency room immediately.
        </p>
      </div>
    </div>
  );
}
