import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';

function DetailsToggle({ children, alt_header = null }) {
  const [isOn, setOn] = useState(false);
  const [hoverActive, setHoverActive] = useState(true);
  const [hoverTimeout, setHoverTimeout] = useState(null);

  const handleToggleClick = () => {
    setOn(!isOn);
    setHoverActive(isOn); // Toggle hover activation based on current state
  };

  const handleMouseEnter = () => {
    if (!hoverActive) return; // Ignore hover if disabled
    const timeout = setTimeout(() => {
      setOn(true);
    }, 500); // 500ms delay
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (hoverActive) {
      clearTimeout(hoverTimeout);
      setOn(false); // Collapse content only if it was opened by hover
    }
  };

  useEffect(() => {
    return () => clearTimeout(hoverTimeout);
  }, [hoverTimeout]);

  return (
    <div className='detailsToggle'>
      <span 
        className={styles.link} 
        onClick={handleToggleClick}
        onMouseEnter={handleMouseEnter} 
        onMouseLeave={handleMouseLeave}
      >
        <span className={`${styles.toggle} ${isOn ? null : styles.toggleUpsideDown}`}></span>&nbsp;
        <span>{alt_header}</span>
        {/* Visual disclaimer */}
        <small className={styles.disclaimer}>Hover to view</small>
      </span>
      <div 
        style={{ display: isOn ? 'block' : 'none' }} 
        className={styles.body}
      >
        {children}
      </div>
    </div>
  );
}

export default DetailsToggle;
