'use client';

import React from 'react';

interface QuantityStepperProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  className = '',
}: QuantityStepperProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div
      className={`flex items-center gap-sm bg-surface-container-low rounded-full px-sm py-xs shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface hover:bg-surface hover:shadow-sm transition-all disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-[18px]">remove</span>
      </button>
      <span className="font-body-md text-on-surface w-6 text-center font-medium select-none">
        {value}
      </span>
      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface hover:bg-surface hover:shadow-sm transition-all disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
      </button>
    </div>
  );
}
