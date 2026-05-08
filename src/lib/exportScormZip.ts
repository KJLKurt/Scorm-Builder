import JSZip from 'jszip';
import type { Quiz, QuizSource } from '../types/quiz';
import { generateManifest } from './scormManifest';

// Vite raw imports for runtime files
import runtimeIndexHtml from '../runtime/index.html?raw';
import quizRuntimeJs from '../runtime/quiz-runtime.js?raw';
import scormWrapperJs from '../runtime/scorm-wrapper.js?raw';
import runtimeCss from '../runtime/style.css?raw';

export async function exportScormZip(quiz: Quiz): Promise<void> {
  const zip = new JSZip();

  // Build quiz-data.json (runtime data — same structure as source)
  const quizDataJson = JSON.stringify({ quiz }, null, 2);

  // Build quiz-source.json (for reimport into the builder)
  const source: QuizSource = {
    schema: 'simple-scorm-quiz-builder',
    schemaVersion: '1.0.0',
    scormVersion: '1.2',
    quiz,
  };
  const quizSourceJson = JSON.stringify(source, null, 2);

  // Build index.html — embed quiz data inline for LMS compatibility
  const indexHtml = runtimeIndexHtml
    .replace('{{QUIZ_TITLE}}', escapeHtmlAttr(quiz.title))
    .replace('{{QUIZ_DATA_JSON}}', quizDataJson);

  zip.file('imsmanifest.xml', generateManifest(quiz));
  zip.file('index.html', indexHtml);
  zip.file('quiz-runtime.js', quizRuntimeJs);
  zip.file('scorm-wrapper.js', scormWrapperJs);
  zip.file('style.css', runtimeCss);
  zip.file('quiz-data.json', quizDataJson);
  zip.file('quiz-source.json', quizSourceJson);

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  triggerDownload(blob, sanitizeFilename(quiz.title) + '.zip');
}

function escapeHtmlAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sanitizeFilename(name: string): string {
  return (name.trim().replace(/[^a-z0-9_\- ]/gi, '_').replace(/\s+/g, '_') || 'quiz');
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
