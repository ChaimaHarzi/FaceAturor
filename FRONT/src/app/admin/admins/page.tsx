'use client';

import { Button, Result } from 'antd';
import Link from 'next/link';
import { MdAdd } from 'react-icons/md';
import { RoleTag } from '@/components/common/ui';
import UsersDirectory from '@/components/users/UsersDirectory';
import { formatDate } from '@/lib/format';
import { useCurrentUser } from '@/lib/hooks';
import { Role } from '@/lib/roles';

/** Report, "Manage admins accounts": reserved to the super admin. */
export default function AdminsPage() {
  const me = useCurrentUser();
  if (me && me.role !== Role.SUPER_ADMIN) {
    return (
      <Result
        status="403"
        title="Super admin only"
        subTitle="Only the super admin can manage admin accounts."
      />
    );
  }
  return (
    <UsersDirectory
      title="Admins"
      subtitle="Administrators of the platform."
      query="role=admin"
      canDelete
      canMessage
      extraColumns={[
        {
          title: 'Role',
          dataIndex: 'role',
          render: (role: Role) => <RoleTag role={role} />,
        },
        {
          title: 'Since',
          dataIndex: 'createdAt',
          render: (d) => formatDate(d),
          responsive: ['lg'],
        },
      ]}
      headerExtra={
        <Link href={`/admin/users/new?role=${Role.ADMIN}`}>
          <Button type="primary" icon={<MdAdd />}>
            Add admin
          </Button>
        </Link>
      }
    />
  );
}
