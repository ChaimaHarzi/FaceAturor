'use client';

import { Button } from 'antd';
import Link from 'next/link';
import { MdAdd } from 'react-icons/md';
import UsersDirectory from '@/components/users/UsersDirectory';
import { formatDate } from '@/lib/format';
import { Role } from '@/lib/roles';

export default function AdminMentorsPage() {
  return (
    <UsersDirectory
      title="Mentors"
      subtitle="Mentors meet the families and match each child with the right teachers."
      query="role=mentor"
      canDelete
      canMessage
      extraColumns={[
        {
          title: 'Since',
          dataIndex: 'createdAt',
          render: (d) => formatDate(d),
          responsive: ['lg'],
        },
      ]}
      headerExtra={
        <Link href={`/admin/users/new?role=${Role.MENTOR}`}>
          <Button type="primary" icon={<MdAdd />}>
            Add mentor
          </Button>
        </Link>
      }
    />
  );
}
