'use client';

import { Alert, Button, DatePicker, Form, Input, Radio, Result } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import Link from 'next/link';
import { useState } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import { Gender } from '@/lib/roles';

interface RegisterValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender;
  password: string;
  confirmPassword: string;
  availability: [Dayjs, Dayjs];
}

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<string>();

  const onFinish = async (values: RegisterValues) => {
    setLoading(true);
    setError(undefined);
    try {
      const [from, to] = values.availability;
      const { data } = await api.post<{ message: string }>('/auth/register', {
        name: `${values.firstName.trim()} ${values.lastName.trim()}`,
        email: values.email,
        phone: values.phone,
        gender: values.gender,
        password: values.password,
        availableFrom: from.startOf('day').toISOString(),
        availableTo: to.endOf('day').toISOString(),
      });
      setDone(data.message);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Result
        status="success"
        title="Check your inbox"
        subTitle={`${done} Once verified, a mentor will contact you for a first meeting during the period you selected.`}
        extra={
          <Link href="/login">
            <Button type="primary">Go to sign in</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-navy">
        Create your parent account
      </h1>
      <p className="mb-6 mt-1 text-gray-500">
        Tell us when you are available: a mentor will meet you to understand
        your child’s needs.
      </p>
      {error && (
        <Alert className="mb-4" type="error" showIcon message={error} />
      )}

      <Form<RegisterValues>
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        initialValues={{ gender: Gender.MALE }}
      >
        <div className="grid grid-cols-2 gap-x-3">
          <Form.Item
            name="firstName"
            label="First name"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input autoComplete="given-name" />
          </Form.Item>
          <Form.Item
            name="lastName"
            label="Last name"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input autoComplete="family-name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email' }]}
          >
            <Input autoComplete="email" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[
              {
                required: true,
                pattern: /^[+\d\s-]{6,20}$/,
                message: 'Enter a valid phone number',
              },
            ]}
          >
            <Input autoComplete="tel" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[
              {
                required: true,
                pattern: PASSWORD_RULE,
                message: '8+ characters with letters and numbers',
              },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Confirm password"
            dependencies={['password']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  !value || value === getFieldValue('password')
                    ? Promise.resolve()
                    : Promise.reject(new Error('Passwords do not match')),
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        </div>
        <Form.Item name="gender" label="Gender">
          <Radio.Group>
            <Radio value={Gender.MALE}>Male</Radio>
            <Radio value={Gender.FEMALE}>Female</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          name="availability"
          label="Availability for the first meeting"
          rules={[{ required: true, message: 'Select a date range' }]}
        >
          <DatePicker.RangePicker
            className="w-full"
            disabledDate={(d) => d.isBefore(dayjs(), 'day')}
          />
        </Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          block
          size="large"
          loading={loading}
        >
          Sign up
        </Button>
      </Form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-brand">
          Sign in
        </Link>
      </p>
    </>
  );
}
