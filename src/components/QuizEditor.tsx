import { useState } from 'react';
import type { Quiz, Question } from '../types/quiz';
import QuizSettingsEditor from './QuizSettingsEditor';
import QuestionList from './QuestionList';
import QuestionEditor from './QuestionEditor';

interface Props {
  quiz: Quiz;
  onChange: (quiz: Quiz) => void;
}

type EditorPanel = 'settings' | 'questions';

export default function QuizEditor({ quiz, onChange }: Props) {
  const [panel, setPanel] = useState<EditorPanel>('settings');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  function patchQuiz(partial: Partial<Quiz>) {
    onChange({ ...quiz, ...partial });
  }

  function patchQuestions(questions: Question[]) {
    patchQuiz({ questions });
    // Keep selection valid
    if (selectedQuestionId && !questions.find(q => q.id === selectedQuestionId)) {
      setSelectedQuestionId(questions.length > 0 ? questions[questions.length - 1].id : null);
    }
  }

  function handleQuestionChange(updated: Question) {
    patchQuestions(quiz.questions.map(q => (q.id === updated.id ? updated : q)));
  }

  function handleDeleteQuestion(id: string) {
    const qs = quiz.questions.filter(q => q.id !== id);
    patchQuestions(qs);
    setSelectedQuestionId(qs.length > 0 ? qs[qs.length - 1].id : null);
  }

  function handleSelectQuestion(id: string) {
    setSelectedQuestionId(id);
    setPanel('questions');
  }

  const selectedQuestion = quiz.questions.find(q => q.id === selectedQuestionId) ?? null;

  return (
    <div>
      {/* Panel tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 3, width: 'fit-content' }}>
        <button
          className={`app-tab ${panel === 'settings' ? 'active' : ''}`}
          onClick={() => setPanel('settings')}
        >
          Settings
        </button>
        <button
          className={`app-tab ${panel === 'questions' ? 'active' : ''}`}
          onClick={() => setPanel('questions')}
        >
          Questions ({quiz.questions.length})
        </button>
      </div>

      {panel === 'settings' && (
        <QuizSettingsEditor quiz={quiz} onChange={patchQuiz} />
      )}

      {panel === 'questions' && (
        <div style={{ display: 'flex', gap: 16 }}>
          {/* Left: question list */}
          <div style={{ flex: '0 0 280px' }}>
            <QuestionList
              questions={quiz.questions}
              selectedId={selectedQuestionId}
              onSelect={handleSelectQuestion}
              onChange={qs => {
                patchQuestions(qs);
                if (!selectedQuestionId && qs.length > 0) setSelectedQuestionId(qs[qs.length - 1].id);
              }}
            />
          </div>

          {/* Right: question editor */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {selectedQuestion ? (
              <QuestionEditor
                question={selectedQuestion}
                onChange={handleQuestionChange}
                onDelete={() => handleDeleteQuestion(selectedQuestion.id)}
              />
            ) : (
              <div className="card">
                <div className="card-body">
                  <div className="empty-state">
                    <h3>No question selected</h3>
                    <p>Select a question from the list, or add a new one.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
