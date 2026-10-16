import React, { useRef, useState, useEffect, useCallback } from 'react';

export default function ProductRow({ children }) {
  const rowRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = rowRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows, React.Children.count(children)]);

  const scrollByPage = (direction) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <div className="row-wrap">
      {canScrollLeft && (
        <button
          type="button"
          className="row-arrow row-arrow-left"
          onClick={() => scrollByPage(-1)}
          aria-label="Scroll left"
        >
          ‹
        </button>
      )}

      <div className="product-row-scroll" ref={rowRef}>
        {children}
      </div>

      {canScrollRight && (
        <button
          type="button"
          className="row-arrow row-arrow-right"
          onClick={() => scrollByPage(1)}
          aria-label="Scroll right"
        >
          ›
        </button>
      )}
    </div>
  );
}