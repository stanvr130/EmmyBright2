import React, { useState } from 'react';

export default function DeliveryAnimation() {
  const [hidden, setHidden] = useState(() => {
    try {
      return sessionStorage.getItem('eb_hideDelivery') === '1';
    } catch {
      return false;
    }
  });

  if (hidden) return null;

  const handleClose = () => {
    setHidden(true);
    try {
      sessionStorage.setItem('eb_hideDelivery', '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="delivery-pill" role="status">
      <div className="delivery-lane" aria-hidden="true">
        <span className="delivery-truck">
          <span className="delivery-truck-inner">🚚</span>
        </span>
        <span className="delivery-road" />
      </div>
      <div className="delivery-text">
        <strong>Quick delivery</strong>
        <span>Ibadan: 1–2 days</span>
      </div>
      <button
        type="button"
        className="delivery-close"
        onClick={handleClose}
        aria-label="Hide delivery notice"
      >
        ✕
      </button>
    </div>
  );
}