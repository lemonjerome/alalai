'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface MedicalRecordCardProps {
  record: {
    _id: string;
    consultationNotes?: string;
    diagnosis?: string;
    prescriptions?: Prescription[];
    followUpDate?: string;
    createdAt: string;
  };
  patientName?: string;
  doctorName?: string;
  isEditable?: boolean;
  onEdit?: () => void;
}

export function MedicalRecordCard({
  record,
  patientName,
  doctorName,
  isEditable,
  onEdit,
}: MedicalRecordCardProps) {
  const [expanded, setExpanded] = useState(false);
  const createdAt = new Date(record.createdAt);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            {doctorName && (
              <p className="text-xs text-gray-500 mb-0.5">Dr. {doctorName}</p>
            )}
            {patientName && (
              <p className="text-xs text-gray-500 mb-0.5">Patient: {patientName}</p>
            )}
            <p className="text-xs text-gray-400">
              {createdAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isEditable && (
              <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                Editable
              </Badge>
            )}
            {!isEditable && (
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                Locked
              </Badge>
            )}
          </div>
        </div>

        {record.diagnosis && (
          <div className="mt-2">
            <span className="text-sm font-semibold text-gray-900">Diagnosis: </span>
            <span className="text-sm text-gray-700">{record.diagnosis}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-sm text-sky-600 hover:text-sky-700 font-medium"
        >
          {expanded ? 'Collapse ▲' : 'Expand details ▼'}
        </button>

        {expanded && (
          <div className="space-y-4 pt-2 border-t border-gray-100">
            {record.consultationNotes && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Consultation Notes
                </h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {record.consultationNotes}
                </p>
              </div>
            )}

            {record.prescriptions && record.prescriptions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Prescriptions ({record.prescriptions.length})
                </h4>
                <div className="space-y-2">
                  {record.prescriptions.map((rx, i) => (
                    <div
                      key={i}
                      className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm"
                    >
                      <p className="font-medium text-gray-900">{rx.medication}</p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        {rx.dosage} · {rx.frequency} · {rx.duration}
                      </p>
                      {rx.instructions && (
                        <p className="text-gray-500 text-xs mt-0.5 italic">{rx.instructions}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {record.followUpDate && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Follow-Up Date
                </h4>
                <p className="text-sm text-gray-700">
                  {new Date(record.followUpDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        )}

        {isEditable && onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit Record
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
