import React from 'react';
import { Link } from 'react-router-dom';

const WHATSAPP_NUMBER = '2348139108077';

export default function LandingHero({
  categories = [],
  products = [],
  getProductImageUrl,
  onSelectCategory,
  onShopNow
}) {
  const tiles = categories
    .map((cat) => {
      const inCategory = products.filter(
        (p) => (p.categoryRef?.id ?? p.categoryId) === cat.id
      );
      const withImage = inCategory.find((p) => getProductImageUrl(p));
      return {
        ...cat,
        count: inCategory.length,
        image: withImage ? getProductImageUrl(withImage) : null
      };
    })
    .filter((cat) => cat.count > 0)
    .slice(0, 4); // Limit to a maximum of 4 categories on the homepage

  return (
    <>
      <section className="lh-hero">
        <p className="lh-eyebrow">Bespoke suits · Italian shoes</p>
        <h1 className="lh-title">Dressed to impress, delivered to your door.</h1>
        <p className="lh-sub">
          Premium tailoring and quality footwear from EmmyBright. Pick your style,
          and we'll get it to you fast.
        </p>
        <div className="lh-actions">
          <button type="button" className="lh-btn lh-btn-primary" onClick={onShopNow}>
            Shop now
          </button>
          <a
            className="lh-btn lh-btn-ghost"
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Chat on WhatsApp
          </a>
        </div>
      </section>

      {tiles.length > 0 && (
        <section className="section">
          <h2 className="section-title">
            <Link to="/categories" className="lh-title-link">
              Shop by category
            </Link>
          </h2>
          <div className="lh-tiles">
            {tiles.map((tile, i) => (
              <button
                type="button"
                key={tile.id}
                className="lh-tile"
                style={{ '--i': i }}
                onClick={() => onSelectCategory(tile.id)}
              >
                <span
                  className="lh-tile-bg"
                  style={tile.image ? { backgroundImage: `url("${tile.image}")` } : undefined}
                />
                <span className="lh-tile-shade" />
                <span className="lh-tile-body">
                  <span className="lh-tile-name">{tile.name}</span>
                  <span className="lh-tile-count">
                    {tile.count} {tile.count === 1 ? 'item' : 'items'}
                  </span>
                </span>
                <span className="lh-tile-arrow">→</span>
              </button>
            ))}
          </div>
          <div className="lh-more-row">
            <Link to="/categories" className="lh-more-dots" aria-label="More categories">
              •••
            </Link>
          </div>
        </section>
      )}
    </>
  );
}