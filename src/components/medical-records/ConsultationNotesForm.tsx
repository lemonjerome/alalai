'use client';

import { useState } from 'react';
import { useForm, FormProvider, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { PrescriptionForm } from './PrescriptionForm';
import {
  createMedicalRecordSchema,
  type CreateMedicalRecordOutput,
  type CreateMedicalRecordInput,
} from '@/lib/validations/medicalRecord';

interface ConsultationNotesFormProps {
  appointmentId: string;
  mode: 'create' | 'edit';
  defaultValues?: Partial<CreateMedicalRecordOutput>;
  onSuccess?: () => void;
}

export function ConsultationNotesForm({
  appointmentId,
  mode,
  defaultValues,
  onSuccess,
}: ConsultationNotesFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const methods = useForm<CreateMedicalRecordOutput>({
    // Cast needed: zodResolver is typed to the schema's input type, but
    // at runtime it correctly produces the output type (after defaults).
    resolver: zodResolver(createMedicalRecordSchema) as unknown as Resolver<CreateMedicalRecordOutput>,
    defaultValues: {
      consultationNotes: '',
      diagnosis: '',
      prescriptions: [],
      followUpDate: null,
      attachments: [],
      ...defaultValues,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = methods;

  const onSubmit = async (data: CreateMedicalRecordOutput) => {
    setServerError(null);

    // Build a clean API payload
    const payload: CreateMedicalRecordInput = {
      ...data,
      followUpDate: data.followUpDate ?? undefined,
    };

    const res = await fetch(`/api/medical-records/${appointmentId}`, {
      method: mode === 'create' ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      setServerError(json.error ?? 'Failed to save record');
      return;
    }

    onSuccess?.();
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {serverError && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="consultationNotes">Consultation Notes</Label>
          <Textarea
            id="consultationNotes"
            placeholder="Describe symptoms, examination findings, and the course of the consultation..."
            rows={5}
            {...register('consultationNotes')}
          />
          {errors.consultationNotes && (
            <p className="text-xs text-red-500">{errors.consultationNotes.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="diagnosis">Diagnosis</Label>
          <Input
            id="diagnosis"
            placeholder="e.g. Upper respiratory tract infection, viral"
            {...register('diagnosis')}
          />
          {errors.diagnosis && (
            <p className="text-xs text-red-500">{errors.diagnosis.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="followUpDate">Follow-Up Date (optional)</Label>
          <Input
            id="followUpDate"
            type="date"
            {...register('followUpDate', {
              setValueAs: (v: string) => (v ? new Date(v).toISOString() : null),
            })}
          />
        </div>

        <PrescriptionForm />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Save Record' : 'Update Record'}
        </Button>
      </form>
    </FormProvider>
  );
}
