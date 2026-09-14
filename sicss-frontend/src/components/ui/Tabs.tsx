import type { ReactNode } from 'react';

interface TabsProps {
  children: ReactNode;
  className?: string;
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  children: ReactNode;
  value: string;
  activeValue: string;
  onClick: (value: string) => void;
  className?: string;
}

interface TabsContentProps {
  children: ReactNode;
  value: string;
  activeValue: string;
  className?: string;
}

export function Tabs({ children, className = '' }: TabsProps) {
  return <div className={className}>{children}</div>;
}

export function TabsList({ children, className = '' }: TabsListProps) {
  return <div className={`flex border-b border-slate-200 ${className}`}>{children}</div>;
}

export function TabsTrigger({ children, value, activeValue, onClick, className = '' }: TabsTriggerProps) {
  const isActive = value === activeValue;
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
        isActive
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, value, activeValue, className = '' }: TabsContentProps) {
  if (value !== activeValue) return null;
  return <div className={`py-6 ${className}`}>{children}</div>;
}
