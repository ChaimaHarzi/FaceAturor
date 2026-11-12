import { Button, Result } from 'antd';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Result
        status="404"
        title="Page not found"
        subTitle="The page you are looking for does not exist."
        extra={
          <Link href="/">
            <Button type="primary">Back home</Button>
          </Link>
        }
      />
    </div>
  );
}
