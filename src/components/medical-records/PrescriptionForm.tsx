'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CreateMedicalRecordOutput } from '@/lib/validations/medicalRecord';

export function PrescriptionForm() {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateMedicalRecordOutput>();

  const { fields, append, remove } = useFieldArray<CreateMedicalRecordOutput, 'prescriptions'>({
    name: 'prescriptions',
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Prescriptions</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              medication: '',
              dosage: '',
              frequency: '',
              duration: '',
              instructions: '' as string,
            })
          }
        >
          + Add Prescription
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-gray-500 italic">No prescriptions added. Click "Add Prescription" to add one.</p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Prescription {index + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(index)}
              className="text-red-500 hover:text-red-700 text-xs"
              aria-label={`Remove prescription ${index + 1}`}
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor={`prescriptions.${index}.medication`}>Medication</Label>
              <Input
                id={`prescriptions.${index}.medication`}
                placeholder="e.g. Amoxicillin 500mg"
                {...register(`prescriptions.${index}.medication`)}
              />
              {errors.prescriptions?.[index]?.medication && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.prescriptions[index]?.medication?.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor={`prescriptions.${index}.dosage`}>Dosage</Label>
              <Input
                id={`prescriptions.${index}.dosage`}
                placeholder="e.g. 500mg"
                {...register(`prescriptions.${index}.dosage`)}
              />
              {errors.prescriptions?.[index]?.dosage && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.prescriptions[index]?.dosage?.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor={`prescriptions.${index}.frequency`}>Frequency</Label>
              <Input
                id={`prescriptions.${index}.frequency`}
                placeholder="e.g. 3x daily"
                {...register(`prescriptions.${index}.frequency`)}
              />
              {errors.prescriptions?.[index]?.frequency && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.prescriptions[index]?.frequency?.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor={`prescriptions.${index}.duration`}>Duration</Label>
              <Input
                id={`prescriptions.${index}.duration`}
                placeholder="e.g. 7 days"
                {...register(`prescriptions.${index}.duration`)}
              />
              {errors.prescriptions?.[index]?.duration && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.prescriptions[index]?.duration?.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor={`prescriptions.${index}.instructions`}>Instructions</Label>
              <Input
                id={`prescriptions.${index}.instructions`}
                placeholder="e.g. Take with food"
                {...register(`prescriptions.${index}.instructions`)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
