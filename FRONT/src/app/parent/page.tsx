import { redirect } from 'next/navigation';

export default function ParentHome() {
  redirect('/parent/children');
}
