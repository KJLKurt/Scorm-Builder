export type QuestionType = 'multiple_choice' | 'true_false';

export type ResumeMode =
  | 'start_fresh'
  | 'resume_in_progress'
  | 'show_submitted_answers';

export interface Choice {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  choices: Choice[];
  correctChoiceIds: string[];
  feedbackCorrect?: string;
  feedbackIncorrect?: string;
}

export interface ReportingSettings {
  reportScore: boolean;
  reportCompletion: boolean;
  reportPassFail: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  passingScore: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  resumeMode: ResumeMode;
  lockAfterSubmit: boolean;
  allowRetake: boolean;
  reporting: ReportingSettings;
  questions: Question[];
}

export interface QuizSource {
  schema: 'simple-scorm-quiz-builder';
  schemaVersion: '1.0.0';
  scormVersion: '1.2';
  quiz: Quiz;
}

export interface ValidationError {
  field: string;
  message: string;
}

export type AppTab = 'editor' | 'preview';
