import { BadRequestException } from '@nestjs/common';
import { scoreQuiz, validateQuestions } from './scoring';

const questions = [
  { choices: ['10', '12', '14'], correctIndex: 1 },
  { choices: ['Mars', 'Venus'], correctIndex: 0 },
  { choices: ['a', 'b', 'c', 'd'], correctIndex: 3 },
];

describe('scoreQuiz', () => {
  it('counts the correct answers', () => {
    expect(scoreQuiz(questions, [1, 0, 3])).toEqual({ score: 3, total: 3 });
    expect(scoreQuiz(questions, [0, 0, 1])).toEqual({ score: 1, total: 3 });
  });

  it('requires an answer for every question', () => {
    expect(() => scoreQuiz(questions, [1, 0])).toThrow(BadRequestException);
  });

  it('rejects answers outside the choices', () => {
    expect(() => scoreQuiz(questions, [1, 2, 0])).toThrow(/question 2/);
    expect(() => scoreQuiz(questions, [1, 0, -1])).toThrow(BadRequestException);
    expect(() => scoreQuiz(questions, [1.5, 0, 0])).toThrow(BadRequestException);
  });
});

describe('validateQuestions', () => {
  it('accepts well-formed questions', () => {
    expect(() => validateQuestions(questions)).not.toThrow();
  });

  it('rejects a correct answer that is not one of the choices', () => {
    expect(() => validateQuestions([{ choices: ['a', 'b'], correctIndex: 2 }])).toThrow(
      /Question 1/,
    );
  });
});
