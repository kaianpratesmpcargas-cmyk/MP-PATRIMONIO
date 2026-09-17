import React from 'react';
import { PackageOpen } from 'lucide-react';

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = (status || 'Ativo').toLowerCase();

  if (normalized.includes('ativo')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00A878]/10 text-[#00A878] border border-[#00A878]/20 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#00A878]"></span>
        Ativo
      </span>
    );
  }

  if (normalized.includes('manuten')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        Em Manutenção
      </span>
    );
  }

  if (normalized.includes('baix') || normalized.includes('inativ') || normalized.includes('avari')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-[#DC2626] border border-red-200 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>
        {status}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-[#6B7280] border border-[#E5E7EB] ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
      {status}
    </span>
  );
};

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = PackageOpen,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-xl border border-[#E5E7EB] my-4">
      <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-[#6B7280] mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-[#171717] mb-1">{title}</h3>
      <p className="text-xs text-[#6B7280] max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-[#FFC400] hover:bg-[#F5B800] text-[#111111] text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
