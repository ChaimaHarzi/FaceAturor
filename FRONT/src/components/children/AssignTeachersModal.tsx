'use client';

import { Alert, Modal, Select } from 'antd';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { childName } from '@/lib/format';
import { useApi, useNotify } from '@/lib/hooks';
import type { Child, User } from '@/types/models';

interface Props {
  child?: Child | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Mentor/admin matches a student with suitable teachers (report: role of mentors). */
export default function AssignTeachersModal({
  child,
  onClose,
  onSaved,
}: Props) {
  const notify = useNotify();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { data: teachers } = useApi<User[]>(
    child ? '/users?role=teacher' : null
  );

  useEffect(() => {
    setSelected(child?.teachers.map((t) => t._id) ?? []);
  }, [child]);

  const save = async () => {
    if (!child) return;
    setSaving(true);
    try {
      await api.patch(`/children/${child._id}/teachers`, {
        teacherIds: selected,
      });
      notify.message.success('Teachers updated');
      onSaved();
      onClose();
    } catch (e) {
      notify.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Teachers of ${childName(child)}`}
      open={!!child}
      onCancel={onClose}
      onOk={save}
      confirmLoading={saving}
      okText="Save"
    >
      {child?.specialNeeds && (
        <Alert
          className="mb-4"
          type="info"
          showIcon
          message={`Special needs: ${child.specialNeeds}`}
        />
      )}
      <Select
        mode="multiple"
        className="w-full"
        placeholder="Select teachers"
        value={selected}
        onChange={setSelected}
        loading={!teachers}
        optionFilterProp="label"
        options={teachers?.map((t) => ({
          value: t._id,
          label: `${t.name}${t.expertise?.length ? ` — ${t.expertise.join(', ')}` : ''}`,
        }))}
      />
    </Modal>
  );
}
