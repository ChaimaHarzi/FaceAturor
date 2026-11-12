import type { Gender, Role } from '@/lib/roles';

export interface Rating {
  average: number | null;
  count: number;
}

export interface UserRef {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  gender?: Gender;
  expertise?: string[];
}

export interface User extends UserRef {
  role: Role;
  accountStatus: boolean;
  emailVerified?: boolean;
  availableFrom?: string;
  availableTo?: string;
  mentor?: UserRef | null;
  qualifications?: string[];
  bio?: string;
  rating?: Rating;
  createdAt: string;
}

export interface ChildRef {
  _id: string;
  firstName: string;
  lastName: string;
  grade?: string;
}

export interface Child extends ChildRef {
  parent: UserRef | string;
  gender?: Gender;
  dateOfBirth?: string;
  grade: string;
  specialNeeds?: string;
  teachers: UserRef[];
}

export interface Meeting {
  _id: string;
  title: string;
  parent: UserRef & { availableFrom?: string; availableTo?: string };
  mentor: UserRef;
  createdBy: UserRef;
  date: string;
  durationMinutes: number;
  link: string;
  notes?: string;
}

export interface Contact {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    gender?: Gender;
  };
  lastMessage: { content: string; createdAt: string; mine: boolean } | null;
  unread: number;
}

export interface Message {
  _id: string;
  sender: string;
  receiver: string;
  content: string;
  readAt?: string;
  createdAt: string;
}

export interface Course {
  _id: string;
  teacher: UserRef;
  title: string;
  subject: string;
  description?: string;
  link?: string;
  fileUrl?: string;
  fileName?: string;
  children: ChildRef[];
  createdAt: string;
}

export interface SessionEvent {
  _id: string;
  teacher: UserRef;
  child: ChildRef;
  subject: string;
  description?: string;
  start: string;
  end: string;
  link?: string;
}

export interface Question {
  text: string;
  choices: string[];
  correctIndex?: number;
  /** Student's answer, only after submission. */
  answer?: number;
}

export interface QuizAttemptSummary {
  score: number;
  total: number;
  submittedAt: string;
}

export interface Quiz {
  _id: string;
  teacher: UserRef;
  title: string;
  subject: string;
  description?: string;
  deadline?: string;
  children: ChildRef[];
  questions: Question[];
  createdAt: string;
  // teacher list
  attemptsCount?: number;
  averagePercent?: number | null;
  // student view
  attempt?: QuizAttemptSummary | null;
  questionsCount?: number;
}

export interface QuizAttempt {
  _id: string;
  child: ChildRef;
  answers: number[];
  score: number;
  total: number;
  createdAt: string;
}

export interface Payment {
  _id: string;
  parent: UserRef;
  teacher: UserRef;
  child: ChildRef;
  formation: string;
  amount: number;
  method: 'card' | 'transfer' | 'cash';
  status: 'paid' | 'failed';
  reference: string;
  createdAt: string;
}

export interface Feedback {
  _id: string;
  parent: UserRef;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface TeacherRating {
  _id: string;
  teacher: string;
  score: number;
  description?: string;
}

export interface PublicTeacher {
  id: string;
  name: string;
  gender?: Gender;
  expertise: string[];
  qualifications: string[];
  bio?: string;
  rating: Rating;
}

export interface MonthlyValue {
  month: string;
  value: number;
}
