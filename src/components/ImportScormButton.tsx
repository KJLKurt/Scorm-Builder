import { useRef, useState } from 'react';
import type { Quiz } from '../types/quiz';
import { importScormZip } from '../lib/importScormZip';

interface Props {
  onImport: (quiz: Quiz) => void;
}

export default function ImportScormButton({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);

    const result = await importScormZip(file);

    if (result.ok) {
      onImport(result.quiz);
    } else {
      setError(result.error);
    }
    setLoading(false);
    // Reset so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      <button
        className="btn btn-secondary"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? 'Importing…' : 'Import ZIP'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".zip,application/zip"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      {error && (
        <div className="alert alert-warning" style={{ maxWidth: 360, fontSize: '0.84rem' }}>
          {error}
        </div>
      )}
    </div>
  );
}
