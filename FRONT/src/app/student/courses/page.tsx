'use client';

import { Card, Col, Empty, Row, Skeleton, Tag } from 'antd';
import { PageHeader, UserAvatar } from '@/components/common/ui';
import CourseLinks from '@/components/courses/CourseLink';
import { formatDate } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import { useStudentStore } from '@/lib/student-store';
import type { Course } from '@/types/models';

export default function StudentCoursesPage() {
  const childId = useStudentStore((s) => s.childId);
  const { data, isLoading } = useApi<Course[]>(
    childId ? `/courses?childId=${childId}` : null
  );

  return (
    <div>
      <PageHeader
        title="My courses"
        subtitle="Documents and resources shared by your teachers."
      />
      {isLoading && <Skeleton active />}
      {data && !data.length && (
        <Card>
          <Empty description="No course yet" />
        </Card>
      )}
      <Row gutter={[16, 16]}>
        {data?.map((course) => (
          <Col key={course._id} xs={24} md={12} xl={8}>
            <Card className="h-full">
              <Tag color="blue">{course.subject}</Tag>
              <h3 className="mt-2 text-lg font-semibold">{course.title}</h3>
              {course.description && (
                <p className="mt-1 text-sm text-gray-600">
                  {course.description}
                </p>
              )}
              <div className="mt-3">
                <CourseLinks course={course} />
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <UserAvatar name={course.teacher?.name} size="small" />
                {course.teacher?.name} · {formatDate(course.createdAt)}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
