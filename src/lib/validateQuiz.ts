import type { Quiz, ValidationError } from '../types/quiz';

export function validateQuiz(quiz: Quiz): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!quiz.title.trim()) {
    errors.push({ field: 'title', message: 'Quiz title is required.' });
  }

  if (quiz.questions.length === 0) {
    errors.push({ field: 'questions', message: 'Quiz must have at least one question.' });
  }

  if (quiz.passingScore < 0 || quiz.passingScore > 100) {
    errors.push({ field: 'passingScore', message: 'Passing score must be between 0 and 100.' });
  }

  const { reportCompletion, reportPassFail } = quiz.reporting;
  if (!reportCompletion && !reportPassFail) {
    errors.push({
      field: 'reporting',
      message: 'At least one reporting option (completion or pass/fail) must be enabled.',
    });
  }

  quiz.questions.forEach((q, i) => {
    const prefix = `Question ${i + 1}`;

    if (!q.prompt.trim()) {
      errors.push({ field: `q${i}.prompt`, message: `${prefix}: Prompt is required.` });
    }

    if (q.type === 'multiple_choice') {
      if (q.choices.length < 2) {
        errors.push({
          field: `q${i}.choices`,
          message: `${prefix}: Multiple choice questions must have at least two choices.`,
        });
      }
      q.choices.forEach((c, ci) => {
        if (!c.text.trim()) {
          errors.push({
            field: `q${i}.choice${ci}`,
            message: `${prefix}, Choice ${ci + 1}: Choice text is required.`,
          });
        }
      });
    }

    if (q.correctChoiceIds.length !== 1) {
      errors.push({
        field: `q${i}.correctChoiceIds`,
        message: `${prefix}: Exactly one correct answer is required.`,
      });
    } else {
      const correctId = q.correctChoiceIds[0];
      const validIds = q.choices.map((c) => c.id);
      if (!validIds.includes(correctId)) {
        errors.push({
          field: `q${i}.correctChoiceIds`,
          message: `${prefix}: Correct answer references an unknown choice.`,
        });
      }
    }
  });

  return errors;
}
