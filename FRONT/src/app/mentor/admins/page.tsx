'use client';

import UsersDirectory from '@/components/users/UsersDirectory';

export default function MentorAdminsPage() {
  return (
    <UsersDirectory
      title="Admins"
      subtitle="Contact the administration."
      query="role=admin"
      canMessage
    />
  );
}
