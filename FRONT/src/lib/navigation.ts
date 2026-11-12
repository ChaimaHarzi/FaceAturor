import type { IconType } from 'react-icons';
import {
  MdOutlineAdminPanelSettings,
  MdOutlineAssignment,
  MdOutlineCalendarMonth,
  MdOutlineChildCare,
  MdOutlineDashboard,
  MdOutlineFeedback,
  MdOutlineHourglassTop,
  MdOutlineMenuBook,
  MdOutlineMessage,
  MdOutlinePayments,
  MdOutlinePersonAddAlt,
  MdOutlineQuiz,
  MdOutlineSchool,
  MdOutlineSupervisorAccount,
  MdOutlineVideoCall,
  MdOutlineFamilyRestroom,
  MdOutlineSupportAgent,
} from 'react-icons/md';
import { Role } from './roles';

export interface NavItem {
  href: string;
  label: string;
  icon: IconType;
  /** Visible to the super admin only. */
  superAdminOnly?: boolean;
  /** Shows the unread messages counter. */
  messages?: boolean;
}

export type Space = 'admin' | 'mentor' | 'teacher' | 'parent' | 'student';

export const navigation: Record<Space, NavItem[]> = {
  admin: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: MdOutlineDashboard },
    { href: '/admin/meetings', label: 'Meetings', icon: MdOutlineVideoCall },
    {
      href: '/admin/pending-accounts',
      label: 'Pending accounts',
      icon: MdOutlineHourglassTop,
    },
    {
      href: '/admin/admins',
      label: 'Admins',
      icon: MdOutlineAdminPanelSettings,
      superAdminOnly: true,
    },
    { href: '/admin/mentors', label: 'Mentors', icon: MdOutlineSupportAgent },
    { href: '/admin/teachers', label: 'Teachers', icon: MdOutlineSchool },
    { href: '/admin/parents', label: 'Parents', icon: MdOutlineFamilyRestroom },
    {
      href: '/admin/users/new',
      label: 'Add user',
      icon: MdOutlinePersonAddAlt,
    },
    { href: '/admin/payments', label: 'Payments', icon: MdOutlinePayments },
    { href: '/admin/feedback', label: 'Feedback', icon: MdOutlineFeedback },
    {
      href: '/admin/messages',
      label: 'Messages',
      icon: MdOutlineMessage,
      messages: true,
    },
  ],
  mentor: [
    { href: '/mentor/dashboard', label: 'Dashboard', icon: MdOutlineDashboard },
    {
      href: '/mentor/calendar',
      label: 'Meetings',
      icon: MdOutlineCalendarMonth,
    },
    {
      href: '/mentor/parents',
      label: 'My families',
      icon: MdOutlineFamilyRestroom,
    },
    { href: '/mentor/teachers', label: 'Teachers', icon: MdOutlineSchool },
    {
      href: '/mentor/admins',
      label: 'Admins',
      icon: MdOutlineAdminPanelSettings,
    },
    {
      href: '/mentor/messages',
      label: 'Messages',
      icon: MdOutlineMessage,
      messages: true,
    },
  ],
  teacher: [
    {
      href: '/teacher/dashboard',
      label: 'Dashboard',
      icon: MdOutlineDashboard,
    },
    {
      href: '/teacher/calendar',
      label: 'Calendar',
      icon: MdOutlineCalendarMonth,
    },
    { href: '/teacher/courses', label: 'Courses', icon: MdOutlineMenuBook },
    { href: '/teacher/quizzes', label: 'Quizzes', icon: MdOutlineQuiz },
    {
      href: '/teacher/students',
      label: 'My students',
      icon: MdOutlineChildCare,
    },
    {
      href: '/teacher/mentors',
      label: 'Mentors',
      icon: MdOutlineSupervisorAccount,
    },
    {
      href: '/teacher/messages',
      label: 'Messages',
      icon: MdOutlineMessage,
      messages: true,
    },
  ],
  parent: [
    {
      href: '/parent/children',
      label: 'My children',
      icon: MdOutlineChildCare,
    },
    { href: '/parent/teachers', label: 'Teachers', icon: MdOutlineSchool },
    { href: '/parent/mentor', label: 'My mentor', icon: MdOutlineSupportAgent },
    { href: '/parent/payments', label: 'Payments', icon: MdOutlinePayments },
    {
      href: '/parent/messages',
      label: 'Messages',
      icon: MdOutlineMessage,
      messages: true,
    },
    { href: '/parent/feedback', label: 'Feedback', icon: MdOutlineFeedback },
  ],
  student: [
    {
      href: '/student/dashboard',
      label: 'My progress',
      icon: MdOutlineDashboard,
    },
    {
      href: '/student/calendar',
      label: 'Calendar',
      icon: MdOutlineCalendarMonth,
    },
    { href: '/student/courses', label: 'Courses', icon: MdOutlineMenuBook },
    { href: '/student/quizzes', label: 'Quizzes', icon: MdOutlineAssignment },
  ],
};

export const profileHref = (space: Space) =>
  space === 'student' ? '/parent/profile' : `/${space}/profile`;

export const messagesHref = (role: Role) =>
  ({
    [Role.SUPER_ADMIN]: '/admin/messages',
    [Role.ADMIN]: '/admin/messages',
    [Role.MENTOR]: '/mentor/messages',
    [Role.TEACHER]: '/teacher/messages',
    [Role.PARENT]: '/parent/messages',
  })[role];
