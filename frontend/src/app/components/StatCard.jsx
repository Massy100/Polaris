"use client";
import React from 'react';

const StatCard = ({ title, description, icon, iconBg, iconColor, onClick }) => {
  return (
    <div className="stat-card" onClick={onClick}>
      <div className="card-header">
        <div className="icon-container" style={{ backgroundColor: iconBg, color: iconColor }}>
          {icon}
        </div>
        <h3 className="card-title">{title}</h3>
      </div>
      <p className="card-description">{description}</p>
    </div>
  );
};

export default StatCard;