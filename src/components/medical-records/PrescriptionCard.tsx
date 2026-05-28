interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface PrescriptionCardProps {
  prescriptions: Prescription[];
  doctorName: string;
  patientName: string;
  consultationDate: string;
}

export function PrescriptionCard({
  prescriptions,
  doctorName,
  patientName,
  consultationDate,
}: PrescriptionCardProps) {
  if (prescriptions.length === 0) return null;

  return (
    <>
      {/* Screen view */}
      <div
        className="rounded-xl border border-gray-200 bg-white p-6 space-y-5 print:shadow-none print:border-none"
        id="prescription-card"
      >
        {/* Header */}
        <div className="border-b border-gray-200 pb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Dr. {doctorName}</h2>
            <p className="text-sm text-gray-500 mt-0.5">AlalAI Telehealth Platform</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Date:</p>
            <p className="text-sm font-medium text-gray-700">
              {new Date(consultationDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Patient */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Patient</p>
          <p className="text-base font-semibold text-gray-900 mt-0.5">{patientName}</p>
        </div>

        {/* Prescriptions table */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Prescriptions</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 font-semibold text-gray-700">Medication</th>
                <th className="text-left py-2 pr-4 font-semibold text-gray-700">Dosage</th>
                <th className="text-left py-2 pr-4 font-semibold text-gray-700">Frequency</th>
                <th className="text-left py-2 font-semibold text-gray-700">Duration</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((rx, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 pr-4">
                    <div>
                      <p className="font-medium text-gray-900">{rx.medication}</p>
                      {rx.instructions && (
                        <p className="text-xs text-gray-500 italic mt-0.5">{rx.instructions}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-gray-700">{rx.dosage}</td>
                  <td className="py-2 pr-4 text-gray-700">{rx.frequency}</td>
                  <td className="py-2 text-gray-700">{rx.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signature area */}
        <div className="border-t border-gray-200 pt-4 flex justify-end">
          <div className="text-center">
            <div className="border-b border-gray-400 w-40 mb-1" />
            <p className="text-xs text-gray-500">Physician&apos;s Signature</p>
            <p className="text-sm font-medium text-gray-700 mt-1">Dr. {doctorName}</p>
          </div>
        </div>
      </div>

      {/* Print styles — dangerouslySetInnerHTML avoids styled-jsx (not allowed in RSC) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          #prescription-card, #prescription-card * { visibility: visible; }
          #prescription-card { position: absolute; inset: 0; margin: 2rem; }
        }
      ` }} />
    </>
  );
}
