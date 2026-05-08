import type { ValidationError } from '../types/quiz';

interface Props {
  errors: ValidationError[];
}

export default function ValidationPanel({ errors }: Props) {
  if (errors.length === 0) return null;

  return (
    <div className="card" style={{ borderColor: 'var(--danger)' }}>
      <div className="card-header" style={{ background: 'var(--danger-bg)' }}>
        <h2 style={{ color: '#991b1b' }}>Fix {errors.length} issue{errors.length !== 1 ? 's' : ''} before exporting</h2>
      </div>
      <div className="card-body">
        <ul className="validation-list">
          {errors.map((e, i) => (
            <li key={i} className="validation-item">{e.message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
