import { v4 as uuidv4 } from 'uuid';
import type { Question, QuestionType } from '../types/quiz';

interface Props {
  questions: Question[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (questions: Question[]) => void;
}

function makeQuestion(type: QuestionType): Question {
  if (type === 'true_false') {
    return {
      id: uuidv4(),
      type: 'true_false',
      prompt: '',
      choices: [
        { id: 'true', text: 'True' },
        { id: 'false', text: 'False' },
      ],
      correctChoiceIds: ['true'],
    };
  }
  return {
    id: uuidv4(),
    type: 'multiple_choice',
    prompt: '',
    choices: [
      { id: uuidv4(), text: '' },
      { id: uuidv4(), text: '' },
    ],
    correctChoiceIds: [],
  };
}

export default function QuestionList({ questions, selectedId, onSelect, onChange }: Props) {
  function addQuestion(type: QuestionType) {
    const q = makeQuestion(type);
    onChange([...questions, q]);
    onSelect(q.id);
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    const qs = [...questions];
    [qs[idx - 1], qs[idx]] = [qs[idx], qs[idx - 1]];
    onChange(qs);
  }

  function moveDown(idx: number) {
    if (idx === questions.length - 1) return;
    const qs = [...questions];
    [qs[idx], qs[idx + 1]] = [qs[idx + 1], qs[idx]];
    onChange(qs);
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Questions ({questions.length})</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-sm btn-secondary" onClick={() => addQuestion('multiple_choice')}>
            + Multiple Choice
          </button>
          <button className="btn btn-sm btn-secondary" onClick={() => addQuestion('true_false')}>
            + True / False
          </button>
        </div>
      </div>
      <div className="card-body">
        {questions.length === 0 ? (
          <div className="empty-state">
            <h3>No questions yet</h3>
            <p>Add a question above to get started.</p>
          </div>
        ) : (
          <div className="question-list">
            {questions.map((q, i) => (
              <div
                key={q.id}
                className={`question-row ${q.id === selectedId ? 'selected' : ''}`}
                onClick={() => onSelect(q.id)}
              >
                <span className="question-row-num">{i + 1}</span>
                <span className="question-row-prompt">{q.prompt || '(no prompt)'}</span>
                <span className="question-row-type">
                  {q.type === 'true_false' ? 'T/F' : 'MC'}
                </span>
                <div className="question-row-actions" onClick={e => e.stopPropagation()}>
                  <button
                    className="btn btn-sm btn-ghost btn-icon"
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                    title="Move up"
                  >↑</button>
                  <button
                    className="btn btn-sm btn-ghost btn-icon"
                    onClick={() => moveDown(i)}
                    disabled={i === questions.length - 1}
                    title="Move down"
                  >↓</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
