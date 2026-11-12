import { Space } from 'antd';
import { MdOpenInNew, MdOutlineAttachFile } from 'react-icons/md';
import type { Course } from '@/types/models';

export default function CourseLinks({ course }: { course: Course }) {
  return (
    <Space direction="vertical" size={2}>
      {course.fileUrl && (
        <a
          href={course.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-brand"
        >
          <MdOutlineAttachFile /> {course.fileName ?? 'Document'}
        </a>
      )}
      {course.link && (
        <a
          href={course.link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-brand"
        >
          <MdOpenInNew /> Open link
        </a>
      )}
    </Space>
  );
}
