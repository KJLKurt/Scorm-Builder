import JSZip from 'jszip';
import type { Quiz, QuizSource } from '../types/quiz';

export type ImportResult =
  | { ok: true; quiz: Quiz }
  | { ok: false; error: string; warning?: string };

const SUPPORTED_SCHEMA = 'simple-scorm-quiz-builder';
const SUPPORTED_VERSION = '1.0.0';

export async function importScormZip(file: File): Promise<ImportResult> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    return { ok: false, error: 'The selected file is not a valid ZIP archive.' };
  }

  // Look for quiz-source.json at the ZIP root or one level deep
  const sourceFile =
    zip.file('quiz-source.json') ??
    zip.file(/^[^/]+\/quiz-source\.json$/)?.[0] ??
    null;

  if (!sourceFile) {
    return {
      ok: false,
      error:
        'This SCORM package can be played, but it was not exported from this builder or does not include editable source data (quiz-source.json was not found).',
    };
  }

  let raw: string;
  try {
    raw = await sourceFile.async('text');
  } catch {
    return { ok: false, error: 'Could not read quiz-source.json from the ZIP.' };
  }

  let source: QuizSource;
  try {
    source = JSON.parse(raw) as QuizSource;
  } catch {
    return { ok: false, error: 'quiz-source.json contains invalid JSON.' };
  }

  if (source.schema !== SUPPORTED_SCHEMA) {
    return {
      ok: false,
      error: `Unrecognized schema "${source.schema}". This builder only supports "${SUPPORTED_SCHEMA}".`,
    };
  }

  if (source.schemaVersion !== SUPPORTED_VERSION) {
    return {
      ok: false,
      error: `Unsupported schema version "${source.schemaVersion}". Expected "${SUPPORTED_VERSION}".`,
      warning: 'The package may have been exported from a different version of this builder.',
    };
  }

  if (!source.quiz) {
    return { ok: false, error: 'quiz-source.json does not contain quiz data.' };
  }

  return { ok: true, quiz: source.quiz };
}
