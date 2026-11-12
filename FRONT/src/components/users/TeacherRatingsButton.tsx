'use client';

import { Button, Empty, List, Modal, Rate, Tooltip } from 'antd';
import { useState } from 'react';
import { MdStarOutline } from 'react-icons/md';
import { fromNow } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import type { Rating, UserRef } from '@/types/models';

interface Ratings extends Rating {
  items: Array<{
    _id: string;
    score: number;
    description?: string;
    parent?: UserRef;
    updatedAt: string;
  }>;
}

/** Detailed evaluations of a teacher (admins, mentors, the teacher). */
export default function TeacherRatingsButton({
  teacherId,
  name,
}: {
  teacherId: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const { data } = useApi<Ratings>(
    open ? `/ratings/teacher/${teacherId}` : null
  );
  return (
    <>
      <Tooltip title="Evaluations">
        <Button icon={<MdStarOutline />} onClick={() => setOpen(true)} />
      </Tooltip>
      <Modal
        title={`Evaluations of ${name}`}
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        {data && !data.count ? (
          <Empty description="No evaluation yet" />
        ) : (
          <>
            {data && (
              <div className="mb-4 flex items-center gap-2">
                <Rate disabled allowHalf value={data.average ?? 0} />
                <span className="text-gray-500">
                  {data.average} / 5 · {data.count} evaluation(s)
                </span>
              </div>
            )}
            <List
              loading={!data}
              dataSource={data?.items}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <span className="flex items-center gap-2">
                        <Rate
                          disabled
                          value={item.score}
                          style={{ fontSize: 12 }}
                        />
                        {item.parent?.name}
                      </span>
                    }
                    description={
                      <>
                        {item.description || <i>No comment</i>} ·{' '}
                        <span className="text-xs">
                          {fromNow(item.updatedAt)}
                        </span>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        )}
      </Modal>
    </>
  );
}
