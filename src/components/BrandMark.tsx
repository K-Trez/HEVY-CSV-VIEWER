import React from 'react';

export const BrandMark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`rounded-lg bg-[#141418] border border-line flex items-center justify-center shrink-0 ${className}`}
    aria-hidden="true"
  >
    <svg viewBox="0 0 512 512" className="w-[74%] h-[74%]">
      <rect x="96" y="396" width="320" height="6" rx="3" fill="#F4EFE5" fillOpacity="0.28" />
      <rect x="116" y="300" width="54" height="96" rx="12" fill="#F4EFE5" fillOpacity="0.55" />
      <rect x="190" y="246" width="54" height="150" rx="12" fill="#F4EFE5" fillOpacity="0.72" />
      <rect x="264" y="186" width="54" height="210" rx="12" fill="#F4EFE5" fillOpacity="0.88" />
      <rect x="338" y="126" width="54" height="270" rx="12" fill="#C8342B" />
    </svg>
  </div>
);
