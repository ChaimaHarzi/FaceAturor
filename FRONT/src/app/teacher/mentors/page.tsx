'use client';

import UsersDirectory from '@/components/users/UsersDirectory';

export default function TeacherMentorsPage() {
  return (
    <UsersDirectory
      title="Mentors"
      subtitle="Mentors follow the families: contact them about a student."
      query="role=mentor"
      canMessage
    />
  );
}
