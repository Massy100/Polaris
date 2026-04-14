'use client';

import React from 'react';
import Link from 'next/link';
import '../styles/dashboard-card.css'; 

type IconType = 'teachers' | 'ranking' | 'alerts' | 'history' | 'upload';
type IconColor = 'blue' | 'yellow';

interface DashboardCardProps {
  id: string;
  icon: IconType;
  iconColor: IconColor;
  title: string;
  description: string;
  href: string;
}

function CardIcon({ type, color }: { type: IconType; color: IconColor }) {
  const bgClass = color === 'blue' ? 'iconBgBlue' : 'iconBgYellow';
  const strokeClass = color === 'blue' ? 'iconStrokeBlue' : 'iconStrokeYellow';

  const icons: Record<IconType, React.ReactElement> = {
    teachers: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={strokeClass}>
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    ranking: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={strokeClass}>
        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    alerts: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={strokeClass}>
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    history: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={strokeClass}>
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    upload: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={strokeClass}>
        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  };

  return (
    <div className={`iconWrapper ${bgClass}`}>
      {icons[type]}
    </div>
  );
}

export default function DashboardCard({ icon, iconColor, title, description, href }: DashboardCardProps) {
  return (
    <Link href={href} className="card">
      <div className="header">
        <CardIcon type={icon} color={iconColor} />
        <h2 className="title">{title}</h2>
      </div>
      <p className="description">{description}</p>
    </Link>
  );
}