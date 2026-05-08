import { useState } from 'react';
import type { Quiz } from '../types/quiz';
import { exportScormZip } from '../lib/exportScormZip';
import { validateQuiz } from '../lib/validateQuiz';

interface Props {
  quiz: Quiz;
  onValidationFail: () => void;
}

export default function ExportScormButton({ quiz, onValidationFail }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    const errors = validateQuiz(quiz);
    if (errors.length > 0) {
      onValidationFail();
      return;
    }
    setLoading(true);
    try {
      await exportScormZip(quiz);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="btn btn-primary" onClick={handleExport} disabled={loading}>
      {loading ? 'Exporting…' : 'Export SCORM ZIP'}
    </button>
  );
}
