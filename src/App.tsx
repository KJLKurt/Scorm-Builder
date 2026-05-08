import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Quiz, AppTab } from './types/quiz';
import { validateQuiz } from './lib/validateQuiz';
import QuizEditor from './components/QuizEditor';
import PreviewPlayer from './components/PreviewPlayer';
import ValidationPanel from './components/ValidationPanel';
import ImportScormButton from './components/ImportScormButton';
import ExportScormButton from './components/ExportScormButton';
import ThemeCustomizer from './components/ThemeCustomizer';

const AUTOSAVE_KEY = 'scorm-quiz-builder-draft';

function makeDefaultQuiz(): Quiz {
  return {
    id: uuidv4(),
    title: '',
    description: '',
    passingScore: 80,
    shuffleQuestions: false,
    shuffleAnswers: false,
    resumeMode: 'show_submitted_answers',
    lockAfterSubmit: true,
    allowRetake: false,
    reporting: {
      reportScore: true,
      reportCompletion: true,
      reportPassFail: true,
    },
    questions: [],
  };
}

function loadDraft(): Quiz | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Quiz;
  } catch {
    return null;
  }
}

function saveDraft(quiz: Quiz) {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(quiz));
  } catch {
    // Ignore storage quota errors
  }
}

export default function App() {
  const [quiz, setQuiz] = useState<Quiz>(() => loadDraft() ?? makeDefaultQuiz());
  const [tab, setTab] = useState<AppTab>('editor');
  const [showValidation, setShowValidation] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState<'saved' | 'saving' | null>(null);

  // Autosave with debounce
  const debouncedSave = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>;
      return (q: Quiz) => {
        setSaveIndicator('saving');
        clearTimeout(timer);
        timer = setTimeout(() => {
          saveDraft(q);
          setSaveIndicator('saved');
          setTimeout(() => setSaveIndicator(null), 1500);
        }, 600);
      };
    })(),
    []
  );

  useEffect(() => {
    debouncedSave(quiz);
  }, [quiz, debouncedSave]);

  function handleQuizChange(updated: Quiz) {
    setQuiz(updated);
    setShowValidation(false);
  }

  function handleImport(imported: Quiz) {
    setQuiz(imported);
    setTab('editor');
    setShowValidation(false);
  }

  function handleNewQuiz() {
    if (!window.confirm('Start a new quiz? Your current draft will be lost.')) return;
    const fresh = makeDefaultQuiz();
    setQuiz(fresh);
    setTab('editor');
    setShowValidation(false);
  }

  const validationErrors = showValidation ? validateQuiz(quiz) : [];

  return (
    <div>
      {/* Header */}
      <header className="app-header">
        <span className="app-header-brand">SCORM Quiz Builder</span>

        {/* Tabs */}
        <div className="app-tabs">
          <button className={`app-tab ${tab === 'editor' ? 'active' : ''}`} onClick={() => setTab('editor')}>
            Editor
          </button>
          <button className={`app-tab ${tab === 'preview' ? 'active' : ''}`} onClick={() => setTab('preview')}>
            Preview
          </button>
          <button className={`app-tab ${tab === 'appearance' ? 'active' : ''}`} onClick={() => setTab('appearance')}>
            Appearance
          </button>
        </div>

        {/* Save indicator */}
        {saveIndicator && (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {saveIndicator === 'saving' ? 'Saving…' : '✓ Saved'}
          </span>
        )}

        {/* Actions */}
        <button className="btn btn-sm btn-ghost" onClick={handleNewQuiz} title="New quiz">
          New Quiz
        </button>
        <ImportScormButton onImport={handleImport} />
        <ExportScormButton
          quiz={quiz}
          onValidationFail={() => {
            setShowValidation(true);
            setTab('editor');
          }}
        />
      </header>

      {/* Main content */}
      <main className="app-main">
        {showValidation && validationErrors.length > 0 && (
          <ValidationPanel errors={validationErrors} />
        )}

        {tab === 'editor' && (
          <QuizEditor quiz={quiz} onChange={handleQuizChange} />
        )}

        {tab === 'preview' && (
          <PreviewPlayer quiz={quiz} />
        )}

        {tab === 'appearance' && (
          <ThemeCustomizer />
        )}
      </main>
    </div>
  );
}
