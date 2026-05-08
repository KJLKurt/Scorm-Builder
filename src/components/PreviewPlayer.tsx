import { useState } from 'react';
import type { Quiz, Question } from '../types/quiz';

interface Props {
  quiz: Quiz;
}

type Answers = Record<string, string>; // questionId → choiceId

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PreviewPlayer({ quiz }: Props) {
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [orderedQuestions] = useState<Question[]>(() =>
    quiz.shuffleQuestions ? shuffle(quiz.questions) : quiz.questions
  );

  function handleSelect(qId: string, choiceId: string) {
    if (submitted && quiz.lockAfterSubmit) return;
    setAnswers(prev => ({ ...prev, [qId]: choiceId }));
  }

  function handleSubmit() {
    let correct = 0;
    orderedQuestions.forEach(q => {
      const sel = answers[q.id];
      if (sel && q.correctChoiceIds.includes(sel)) correct++;
    });
    const s = orderedQuestions.length > 0 ? Math.round((correct / orderedQuestions.length) * 100) : 0;
    setScore(s);
    setPassed(s >= quiz.passingScore);
    setSubmitted(true);
  }

  function handleRetake() {
    setAnswers({});
    setSubmitted(false);
    setScore(null);
    setPassed(null);
  }

  const answeredCount = Object.keys(answers).length;
  const total = orderedQuestions.length;

  function renderQuestion(q: Question, idx: number) {
    const isSubmitted = submitted;
    const selectedId = answers[q.id] ?? null;
    const isCorrect = selectedId ? q.correctChoiceIds.includes(selectedId) : false;
    const isLocked = isSubmitted && quiz.lockAfterSubmit;

    const choices = quiz.shuffleAnswers && !submitted
      ? shuffle(q.choices)
      : q.choices;

    return (
      <div
        key={q.id}
        className={`preview-question ${isSubmitted ? (isCorrect ? 'correct' : 'incorrect') : ''}`}
      >
        <div className="preview-q-num">Question {idx + 1} of {total}</div>
        <div className="preview-q-prompt">{q.prompt}</div>
        <ul className="preview-choices">
          {choices.map(c => {
            const isSelected = selectedId === c.id;
            const isCorrectChoice = isSubmitted && q.correctChoiceIds.includes(c.id);
            const isWrongChoice = isSubmitted && isSelected && !isCorrectChoice;

            let cls = 'preview-choice-label';
            if (isSelected) cls += ' chosen';
            if (isCorrectChoice) cls += ' correct';
            if (isWrongChoice) cls += ' wrong';

            return (
              <li key={c.id}>
                <label className={cls} style={{ cursor: isLocked ? 'default' : 'pointer' }}>
                  <input
                    type="radio"
                    name={`preview-q-${q.id}`}
                    checked={isSelected}
                    onChange={() => handleSelect(q.id, c.id)}
                    disabled={isLocked}
                    style={{ accentColor: 'var(--brand)' }}
                  />
                  {c.text}
                </label>
              </li>
            );
          })}
        </ul>
        {isSubmitted && (
          <>
            {isCorrect && q.feedbackCorrect && (
              <div className="preview-feedback correct">{q.feedbackCorrect}</div>
            )}
            {!isCorrect && q.feedbackIncorrect && (
              <div className="preview-feedback incorrect">{q.feedbackIncorrect}</div>
            )}
          </>
        )}
      </div>
    );
  }

  function renderResult() {
    if (score === null) return null;
    const r = quiz.reporting;
    let cls = 'completed';
    let title = 'Completed';
    let desc = r.reportScore ? `Your score: ${score}%` : 'Thank you for completing this quiz.';

    if (r.reportPassFail) {
      cls = passed ? 'passed' : 'failed';
      title = passed ? 'Passed!' : 'Not Passed';
      desc = `Your score: ${score}% (passing: ${quiz.passingScore}%)`;
    }

    return (
      <div className={`preview-result ${cls}`}>
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
    );
  }

  return (
    <div className="preview-frame">
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="badge badge-blue">Preview Mode</span>
        <span className="text-muted" style={{ fontSize: '0.82rem' }}>
          SCORM calls are simulated — no data is sent to an LMS.
        </span>
      </div>
      <div className="preview-inner">
        <div className="preview-header">
          <h2>{quiz.title || 'Untitled Quiz'}</h2>
          {quiz.description && <p>{quiz.description}</p>}
        </div>
        <div className="preview-body">
          {!submitted && total > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, marginBottom: 4 }}>
                <div
                  style={{
                    height: '100%',
                    width: `${total > 0 ? (answeredCount / total) * 100 : 0}%`,
                    background: 'var(--brand)',
                    borderRadius: 3,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
              <p className="text-muted" style={{ fontSize: '0.82rem' }}>
                {answeredCount} of {total} answered
              </p>
            </div>
          )}
          {total === 0 ? (
            <div className="empty-state">
              <h3>No questions</h3>
              <p>Add questions in the editor to see a preview.</p>
            </div>
          ) : (
            orderedQuestions.map((q, i) => renderQuestion(q, i))
          )}
        </div>
        <div className="preview-footer">
          {submitted ? (
            <>
              {renderResult()}
              {quiz.allowRetake && (
                <button className="btn btn-secondary" onClick={handleRetake}>
                  Retake Quiz
                </button>
              )}
            </>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={total === 0}
            >
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
