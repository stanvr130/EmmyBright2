import React from 'react';

const WHATSAPP_NUMBER = '2348139108077';

const PERKS = [
  { icon: '🚚', title: 'Quick delivery', text: 'Ibadan in 1–2 days, express within a day. 3–4 days outside Oyo State.' },
{ icon: '🪡', title: 'Bespoke tailoring', text: 'Italian and Turkish tailoring, made to impress.' },
  { icon: '💬', title: 'Sizing help', text: 'Not sure of your size? Chat with us on WhatsApp.' },
  { icon: '🔒', title: 'Secure payment', text: 'Pay safely through Paystack.' }
];

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
    .filter((cat) => cat.count > 0);

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
          <h2 className="section-title">Shop by category</h2>
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
        </section>
      )}

      <section className="lh-perks">
        {PERKS.map((perk, i) => (
          <div className="lh-perk" key={perk.title} style={{ '--i': i }}>
            <span className="lh-perk-icon">{perk.icon}</span>
            <div>
              <h3>{perk.title}</h3>
              <p>{perk.text}</p>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}