import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CategoriesPage({
  categories = [],
  products = [],
  getProductImageUrl,
  onSelectCategory
}) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const tiles = categories.map((cat) => {
    const inCategory = products.filter(
      (p) => (p.categoryRef?.id ?? p.categoryId) === cat.id
    );
    const withImage = inCategory.find((p) => getProductImageUrl(p));
    return {
      ...cat,
      count: inCategory.length,
      image: withImage ? getProductImageUrl(withImage) : null
    };
  });

  return (
    <section className="section">
      <Link to="/" style={styles.backLink}>← Back to Shop</Link>

      <h2 className="section-title">Shop by category</h2>

      {tiles.length > 0 ? (
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
                {products.length > 0 && (
                  <span className="lh-tile-count">
                    {tile.count === 0
                      ? 'Coming soon'
                      : `${tile.count} ${tile.count === 1 ? 'item' : 'items'}`}
                  </span>
                )}
              </span>
              <span className="lh-tile-arrow">→</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="no-results-text" style={{ textAlign: 'center' }}>No categories yet.</p>
      )}
    </section>
  );
}

const styles = {
  backLink: {
    display: 'inline-block',
    marginBottom: '18px',
    color: '#555555',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none'
  }
};