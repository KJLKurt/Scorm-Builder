import type { Quiz, ResumeMode } from '../types/quiz';

interface Props {
  quiz: Quiz;
  onChange: (patch: Partial<Quiz>) => void;
}

const RESUME_MODES: { value: ResumeMode; label: string; description: string }[] = [
  { value: 'start_fresh', label: 'Start fresh', description: 'Always start from the beginning' },
  { value: 'resume_in_progress', label: 'Resume in progress', description: 'Continue where the learner left off' },
  { value: 'show_submitted_answers', label: 'Show submitted answers', description: 'Re-open in read-only submitted state' },
];

export default function QuizSettingsEditor({ quiz, onChange }: Props) {
  function patchReporting(patch: Partial<Quiz['reporting']>) {
    onChange({ reporting: { ...quiz.reporting, ...patch } });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Basic info */}
      <div className="card">
        <div className="card-header"><h2>Quiz Info</h2></div>
        <div className="card-body">
          <div className="form-group">
            <label htmlFor="quiz-title">Title *</label>
            <input
              id="quiz-title"
              type="text"
              value={quiz.title}
              onChange={e => onChange({ title: e.target.value })}
              placeholder="Enter quiz title"
            />
          </div>
          <div className="form-group">
            <label htmlFor="quiz-desc">Description</label>
            <textarea
              id="quiz-desc"
              value={quiz.description}
              onChange={e => onChange({ description: e.target.value })}
              placeholder="Optional description shown to learners"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="passing-score">Passing score (%)</label>
            <input
              id="passing-score"
              type="number"
              min={0}
              max={100}
              value={quiz.passingScore}
              onChange={e => onChange({ passingScore: Number(e.target.value) })}
              style={{ maxWidth: 120 }}
            />
          </div>
        </div>
      </div>

      {/* SCORM Reporting */}
      <div className="card">
        <div className="card-header"><h2>SCORM Reporting</h2></div>
        <div className="card-body">
          <div className="form-group">
            <span className="label">Report to LMS</span>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={quiz.reporting.reportScore}
                  onChange={e => patchReporting({ reportScore: e.target.checked })}
                />
                Report score (<code>cmi.core.score.raw</code>)
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={quiz.reporting.reportCompletion}
                  onChange={e => patchReporting({ reportCompletion: e.target.checked })}
                />
                Report completion
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={quiz.reporting.reportPassFail}
                  onChange={e => patchReporting({ reportPassFail: e.target.checked })}
                />
                Report pass / fail (overrides completion if both enabled)
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Behavior */}
      <div className="card">
        <div className="card-header"><h2>Behavior</h2></div>
        <div className="card-body">
          <div className="form-group">
            <label htmlFor="resume-mode">Resume mode</label>
            <select
              id="resume-mode"
              value={quiz.resumeMode}
              onChange={e => onChange({ resumeMode: e.target.value as ResumeMode })}
            >
              {RESUME_MODES.map(m => (
                <option key={m.value} value={m.value}>{m.label} — {m.description}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <span className="label">Options</span>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={quiz.shuffleQuestions}
                  onChange={e => onChange({ shuffleQuestions: e.target.checked })}
                />
                Shuffle question order
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={quiz.shuffleAnswers}
                  onChange={e => onChange({ shuffleAnswers: e.target.checked })}
                />
                Shuffle answer choices
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={quiz.lockAfterSubmit}
                  onChange={e => onChange({ lockAfterSubmit: e.target.checked })}
                />
                Lock answers after submission
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={quiz.allowRetake}
                  onChange={e => onChange({ allowRetake: e.target.checked })}
                />
                Allow retake
              </label>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
