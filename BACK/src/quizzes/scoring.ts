import { BadRequestException } from '@nestjs/common';

export interface ScorableQuestion {
  choices: string[];
  correctIndex: number;
}

/** Validates the submitted answers and counts the correct ones. */
export function scoreQuiz(questions: ScorableQuestion[], answers: number[]) {
  if (answers.length !== questions.length) {
    throw new BadRequestException('Please answer every question');
  }
  answers.forEach((answer, i) => {
    if (!Number.isInteger(answer) || answer < 0 || answer >= questions[i].choices.length) {
      throw new BadRequestException(`Invalid answer for question ${i + 1}`);
    }
  });
  const score = questions.reduce((sum, q, i) => sum + (q.correctIndex === answers[i] ? 1 : 0), 0);
  return { score, total: questions.length };
}

/** Throws if a question has a correct answer outside its choices. */
export function validateQuestions(questions: ScorableQuestion[]) {
  questions.forEach((q, i) => {
    if (q.correctIndex >= q.choices.length) {
      throw new BadRequestException(
        `Question ${i + 1}: the correct answer must be one of the choices`,
      );
    }
  });
}
