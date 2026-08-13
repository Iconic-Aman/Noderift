import React from 'react';
import {IconKey} from './constants';

const shared = (color: string) => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: color,
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const ClockIcon: React.FC<{color: string}> = ({color}) => (
  <svg {...shared(color)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

export const MailIcon: React.FC<{color: string}> = ({color}) => (
  <svg {...shared(color)}>
    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill={color} stroke="none" />
  </svg>
);

export const CodeIcon: React.FC<{color: string}> = ({color}) => (
  <svg {...shared(color)}>
    <path d="M16 18l6-6-6-6" />
    <path d="M8 6l-6 6 6 6" />
  </svg>
);

export const SparklesIcon: React.FC<{color?: string; size?: number}> = ({color = '#fff', size = 20}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4" />
    <path d="M22 5h-4" />
  </svg>
);

export const BotIcon: React.FC<{color?: string; size?: number}> = ({color = '#fff', size = 18}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="12" x="3" y="6" rx="2" />
    <path d="M9 11h.01" />
    <path d="M15 11h.01" />
    <path d="M12 2v4" />
  </svg>
);

export const UserIcon: React.FC<{color?: string; size?: number}> = ({color = '#fff', size = 16}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const SendIcon: React.FC<{color?: string; size?: number}> = ({color = '#fff', size = 16}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

export const CheckIcon: React.FC<{color?: string; size?: number}> = ({color = '#fff', size = 16}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const ICONS: Record<IconKey, React.FC<{color: string}>> = {
  clock: ClockIcon,
  mail: MailIcon,
  code: CodeIcon,
};
