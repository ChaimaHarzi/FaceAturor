'use client';

import { RatingDisplay, TagList } from '@/components/common/ui';
import TeacherRatingsButton from '@/components/users/TeacherRatingsButton';
import UsersDirectory from '@/components/users/UsersDirectory';

export default function MentorTeachersPage() {
  return (
    <UsersDirectory
      title="Teachers"
      subtitle="Find the best teacher for each child: expertise, qualifications and parents’ evaluations."
      query="role=teacher"
      canMessage
      extraColumns={[
        {
          title: 'Expertise',
          dataIndex: 'expertise',
          render: (e) => <TagList items={e} color="blue" />,
        },
        {
          title: 'Qualifications',
          dataIndex: 'qualifications',
          render: (q) => <TagList items={q} />,
          responsive: ['xl'],
        },
        {
          title: 'Rating',
          dataIndex: 'rating',
          render: (r) => <RatingDisplay rating={r} />,
          responsive: ['md'],
        },
      ]}
      actions={(u) => <TeacherRatingsButton teacherId={u._id} name={u.name} />}
    />
  );
}
