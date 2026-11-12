'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StudentState {
  childId?: string;
  childName?: string;
  /** The parent opens the student space of one of their children. */
  select: (childId: string, childName: string) => void;
  clear: () => void;
}

export const useStudentStore = create<StudentState>()(
  persist(
    (set) => ({
      select: (childId, childName) => set({ childId, childName }),
      clear: () => set({ childId: undefined, childName: undefined }),
    }),
    { name: 'faceatutor-student' }
  )
);
