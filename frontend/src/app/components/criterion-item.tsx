"use client";

import { useEffect, useRef } from "react";
import "../styles/criterion-item.css";

interface CriterionItemProps {
  id: number;
  name: string;
  description: string;
  percentage: number;
  totalOthers: number;
  onPercentageChange: (id: number, value: number) => void;
  onDelete: (id: number) => void;
}

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const CriterionItem = ({
  id,
  name,
  description,
  percentage,
  totalOthers,
  onPercentageChange,
  onDelete,
}: CriterionItemProps) => {
  const sliderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sliderRef.current) {
      sliderRef.current.style.background = `linear-gradient(to right, #1a1a1a ${percentage}%, #e0e0e0 ${percentage}%)`;
    }
  }, [percentage]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    const max = 100 - totalOthers;
    onPercentageChange(id, Math.min(val, max));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(100 - totalOthers, Math.max(0, Number(e.target.value)));
    onPercentageChange(id, val);
  };

  return (
    <div className="criterion-item">
      <div className="criterion-header">
        <div className="criterion-info">
          <div className="criterion-name-row">
            <span className="criterion-name">{name}</span>
            <button className="criterion-delete" onClick={() => onDelete(id)} aria-label="Delete">
              <TrashIcon />
            </button>
          </div>
          <span className="criterion-description">{description}</span>
        </div>
        <div className="criterion-percentage">
          <input
            type="number"
            className="criterion-input"
            value={percentage}
            min={0}
            max={100 - totalOthers}
            onChange={handleInputChange}
          />
          <span className="criterion-symbol">%</span>
        </div>
      </div>
      <input
        ref={sliderRef}
        type="range"
        className="criterion-slider"
        min={0}
        max={100}
        value={percentage}
        onChange={handleSliderChange}
      />
    </div>
  );
};

export default CriterionItem;