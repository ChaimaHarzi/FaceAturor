'use client';

import { Button } from 'antd';
import Link from 'next/link';
import { MdAdd } from 'react-icons/md';
import { RatingDisplay, TagList } from '@/components/common/ui';
import TeacherRatingsButton from '@/components/users/TeacherRatingsButton';
import UsersDirectory from '@/components/users/UsersDirectory';
import { Role } from '@/lib/roles';

export default function AdminTeachersPage() {
  return (
    <UsersDirectory
      title="Teachers"
      subtitle="Tutors who publish courses and quizzes for their students."
      query="role=teacher"
      canDelete
      canMessage
      extraColumns={[
        {
          title: 'Expertise',
          dataIndex: 'expertise',
          render: (e) => <TagList items={e} color="blue" />,
        },
        {
          title: 'Rating',
          dataIndex: 'rating',
          render: (r) => <RatingDisplay rating={r} />,
          responsive: ['md'],
        },
      ]}
      actions={(u) => <TeacherRatingsButton teacherId={u._id} name={u.name} />}
      headerExtra={
        <Link href={`/admin/users/new?role=${Role.TEACHER}`}>
          <Button type="primary" icon={<MdAdd />}>
            Add teacher
          </Button>
        </Link>
      }
    />
  );
}
