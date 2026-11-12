'use client';

import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Radio,
  Select,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  MdAdd,
  MdArrowDownward,
  MdArrowUpward,
  MdClose,
  MdDeleteOutline,
} from 'react-icons/md';
import { api } from '@/lib/api';
import { childName } from '@/lib/format';
import { useApi, useNotify } from '@/lib/hooks';
import type { Child, Quiz } from '@/types/models';

interface Values {
  title: string;
  subject: string;
  description?: string;
  deadline?: Dayjs;
  children: string[];
  questions: Array<{ text: string; choices: string[]; correctIndex: number }>;
}

const emptyQuestion = () => ({ text: '', choices: ['', ''], correctIndex: 0 });
const letters = 'ABCDEF';

/** Report sprint 5 "Make quizzes": questions, choices and the right answer. */
export default function QuizForm({
  quiz,
  locked,
}: {
  quiz?: Quiz;
  locked?: boolean;
}) {
  const [form] = Form.useForm<Values>();
  const router = useRouter();
  const notify = useNotify();
  const [saving, setSaving] = useState(false);
  const { data: students } = useApi<Child[]>('/children');
  const questions = Form.useWatch('questions', form);

  useEffect(() => {
    if (quiz) {
      form.setFieldsValue({
        ...quiz,
        deadline: quiz.deadline ? dayjs(quiz.deadline) : undefined,
        children: quiz.children.map((c) => c._id),
        questions: quiz.questions.map((q) => ({
          text: q.text,
          choices: q.choices,
          correctIndex: q.correctIndex ?? 0,
        })),
      });
    }
  }, [quiz, form]);

  const submit = async ({ deadline, questions: qs, ...values }: Values) => {
    setSaving(true);
    try {
      const body = {
        ...values,
        deadline: deadline?.endOf('day').toISOString(),
        ...(locked ? {} : { questions: qs }),
      };
      if (quiz) await api.patch(`/quizzes/${quiz._id}`, body);
      else await api.post('/quizzes', body);
      notify.message.success(
        quiz ? 'Quiz updated' : 'Quiz published for your students'
      );
      router.push('/teacher/quizzes');
    } catch (e) {
      notify.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form<Values>
      form={form}
      layout="vertical"
      onFinish={submit}
      requiredMark={false}
      initialValues={{ questions: [emptyQuestion()], children: [] }}
    >
      <Card className="mb-4">
        <div className="grid gap-x-4 md:grid-cols-2">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input placeholder="Quiz 1 – Fractions" />
          </Form.Item>
          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input placeholder="Mathematics" />
          </Form.Item>
          <Form.Item
            name="children"
            label="Students"
            rules={[
              {
                required: true,
                type: 'array',
                min: 1,
                message: 'Select at least one student',
              },
            ]}
          >
            <Select
              mode="multiple"
              loading={!students}
              optionFilterProp="label"
              notFoundContent="No student assigned to you yet"
              options={students?.map((c) => ({
                value: c._id,
                label: `${childName(c)} (${c.grade})`,
              }))}
            />
          </Form.Item>
          <Form.Item name="deadline" label="Deadline">
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
              disabledDate={(d) => d.isBefore(dayjs(), 'day')}
            />
          </Form.Item>
        </div>
        <Form.Item name="description" label="Instructions" className="mb-0">
          <Input.TextArea rows={2} maxLength={1000} />
        </Form.Item>
      </Card>

      {locked && (
        <Alert
          className="mb-4"
          type="info"
          showIcon
          message="Students have already answered: questions can no longer be changed."
        />
      )}

      <Form.List name="questions">
        {(fields, { add, remove, move }) => (
          <div className="space-y-4">
            {fields.map((field, index) => {
              const choices = questions?.[field.name]?.choices ?? [];
              return (
                <Card
                  key={field.key}
                  size="small"
                  title={`Question ${index + 1}`}
                  extra={
                    !locked && (
                      <span className="flex gap-1">
                        <Button
                          size="small"
                          type="text"
                          icon={<MdArrowUpward />}
                          disabled={index === 0}
                          onClick={() => move(index, index - 1)}
                        />
                        <Button
                          size="small"
                          type="text"
                          icon={<MdArrowDownward />}
                          disabled={index === fields.length - 1}
                          onClick={() => move(index, index + 1)}
                        />
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<MdDeleteOutline />}
                          disabled={fields.length === 1}
                          onClick={() => remove(field.name)}
                        />
                      </span>
                    )
                  }
                >
                  <Form.Item
                    name={[field.name, 'text']}
                    rules={[
                      {
                        required: true,
                        whitespace: true,
                        message: 'Write the question',
                      },
                    ]}
                  >
                    <Input.TextArea
                      autoSize
                      placeholder="What is 7 + 5?"
                      disabled={locked}
                    />
                  </Form.Item>
                  <Form.List name={[field.name, 'choices']}>
                    {(
                      choiceFields,
                      { add: addChoice, remove: removeChoice }
                    ) => (
                      <div className="space-y-2">
                        {choiceFields.map((choice, ci) => (
                          <div
                            key={choice.key}
                            className="flex items-center gap-2"
                          >
                            <span className="w-6 text-center font-semibold text-gray-500">
                              {letters[ci]}
                            </span>
                            <Form.Item
                              name={choice.name}
                              noStyle
                              rules={[
                                {
                                  required: true,
                                  whitespace: true,
                                  message: 'Empty choice',
                                },
                              ]}
                            >
                              <Input
                                placeholder={`Choice ${letters[ci]}`}
                                disabled={locked}
                              />
                            </Form.Item>
                            {!locked && (
                              <Button
                                type="text"
                                icon={<MdClose />}
                                disabled={choiceFields.length <= 2}
                                onClick={() => removeChoice(choice.name)}
                              />
                            )}
                          </div>
                        ))}
                        {!locked && choiceFields.length < 6 && (
                          <Button
                            type="dashed"
                            size="small"
                            icon={<MdAdd />}
                            onClick={() => addChoice('')}
                          >
                            Add a choice
                          </Button>
                        )}
                      </div>
                    )}
                  </Form.List>
                  <Form.Item
                    name={[field.name, 'correctIndex']}
                    label="Correct answer"
                    className="mb-0 mt-3"
                    rules={[
                      { required: true },
                      {
                        validator: (_, v) =>
                          v < choices.length
                            ? Promise.resolve()
                            : Promise.reject(
                                new Error('Pick one of the choices')
                              ),
                      },
                    ]}
                  >
                    <Radio.Group
                      disabled={locked}
                      optionType="button"
                      buttonStyle="solid"
                      options={choices.map((_, i) => ({
                        value: i,
                        label: letters[i],
                      }))}
                    />
                  </Form.Item>
                </Card>
              );
            })}
            {!locked && (
              <Button
                type="dashed"
                block
                icon={<MdAdd />}
                onClick={() => add(emptyQuestion())}
              >
                Add a question
              </Button>
            )}
          </div>
        )}
      </Form.List>

      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={() => router.push('/teacher/quizzes')}>Cancel</Button>
        <Button type="primary" htmlType="submit" loading={saving}>
          {quiz ? 'Save' : 'Publish quiz'}
        </Button>
      </div>
    </Form>
  );
}
