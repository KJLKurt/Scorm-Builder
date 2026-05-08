import { v4 as uuidv4 } from 'uuid';
import type { Question, QuestionType, Choice } from '../types/quiz';

interface Props {
  question: Question;
  onChange: (q: Question) => void;
  onDelete: () => void;
}

const TRUE_FALSE_CHOICES: Choice[] = [
  { id: 'true', text: 'True' },
  { id: 'false', text: 'False' },
];

export default function QuestionEditor({ question, onChange, onDelete }: Props) {
  function patch(partial: Partial<Question>) {
    onChange({ ...question, ...partial });
  }

  function handleTypeChange(type: QuestionType) {
    const choices = type === 'true_false' ? TRUE_FALSE_CHOICES : question.choices;
    const correctChoiceIds = type === 'true_false' ? ['true'] : [];
    patch({ type, choices, correctChoiceIds });
  }

  function handleChoiceText(id: string, text: string) {
    patch({ choices: question.choices.map(c => c.id === id ? { ...c, text } : c) });
  }

  function handleCorrectChoice(id: string) {
    patch({ correctChoiceIds: [id] });
  }

  function addChoice() {
    const newChoice: Choice = { id: uuidv4(), text: '' };
    patch({ choices: [...question.choices, newChoice] });
  }

  function deleteChoice(id: string) {
    const choices = question.choices.filter(c => c.id !== id);
    const correctChoiceIds = question.correctChoiceIds.filter(cid => cid !== id);
    patch({ choices, correctChoiceIds });
  }

  const isTrueFalse = question.type === 'true_false';

  return (
    <div className="card">
      <div className="card-header">
        <h2>Question Editor</h2>
        <button className="btn btn-sm btn-danger" onClick={onDelete}>Delete Question</button>
      </div>
      <div className="card-body">

        {/* Type selector */}
        <div className="form-group">
          <label>Question type</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['multiple_choice', 'true_false'] as QuestionType[]).map(t => (
              <button
                key={t}
                className={`btn btn-sm ${question.type === t ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleTypeChange(t)}
              >
                {t === 'multiple_choice' ? 'Multiple Choice' : 'True / False'}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div className="form-group">
          <label htmlFor={`prompt-${question.id}`}>Question prompt *</label>
          <textarea
            id={`prompt-${question.id}`}
            value={question.prompt}
            onChange={e => patch({ prompt: e.target.value })}
            placeholder="Enter the question text…"
          />
        </div>

        {/* Choices */}
        <div className="form-group">
          <span className="label">Answer choices (select the correct one)</span>
          <div className="choices-editor">
            {question.choices.map(c => (
              <div key={c.id} className="choice-row">
                <input
                  type="radio"
                  name={`correct-${question.id}`}
                  checked={question.correctChoiceIds.includes(c.id)}
                  onChange={() => handleCorrectChoice(c.id)}
                  title="Mark as correct"
                />
                <input
                  type="text"
                  value={c.text}
                  onChange={e => handleChoiceText(c.id, e.target.value)}
                  placeholder="Choice text…"
                  disabled={isTrueFalse}
                />
                {!isTrueFalse && (
                  <button
                    className="btn btn-sm btn-ghost btn-icon"
                    onClick={() => deleteChoice(c.id)}
                    title="Remove choice"
                    disabled={question.choices.length <= 2}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {!isTrueFalse && (
            <button className="btn btn-sm btn-secondary" style={{ marginTop: 8 }} onClick={addChoice}>
              + Add Choice
            </button>
          )}
        </div>

        {/* Feedback */}
        <div className="divider" />
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor={`fb-correct-${question.id}`}>Feedback (correct)</label>
            <textarea
              id={`fb-correct-${question.id}`}
              value={question.feedbackCorrect ?? ''}
              onChange={e => patch({ feedbackCorrect: e.target.value || undefined })}
              placeholder="Optional message when correct…"
              style={{ minHeight: 56 }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor={`fb-incorrect-${question.id}`}>Feedback (incorrect)</label>
            <textarea
              id={`fb-incorrect-${question.id}`}
              value={question.feedbackIncorrect ?? ''}
              onChange={e => patch({ feedbackIncorrect: e.target.value || undefined })}
              placeholder="Optional message when incorrect…"
              style={{ minHeight: 56 }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
