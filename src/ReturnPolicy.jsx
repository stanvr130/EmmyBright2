import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const SUPPORT_EMAILS = ['rotannamario@gmail.com', 'stanleyokafor08@gmail.com'];
const WHATSAPP_URL = 'https://wa.me/2348139108077';
const WHATSAPP_DISPLAY = '+234 813 910 8077';

const pageCSS = `
  .rp-page,
  .rp-page * {
    box-sizing: border-box;
  }
  .rp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px;
  }
  .rp-link:hover {
    text-decoration: underline;
  }
  .rp-back:hover {
    text-decoration: underline;
  }
`;

function ReturnPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="rp-page" style={styles.page}>
      <style>{pageCSS}</style>

      <Link to="/" className="rp-back" style={styles.backLink}>← Back to Shop</Link>

      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>Return &amp; Exchange Policy</h1>
        <p style={styles.updated}>
          Last updated: October 2026 &nbsp;|&nbsp; <strong style={styles.updatedBrand}>EmmyBright</strong>
        </p>
      </header>

      {/* Overview */}
      <p style={styles.intro}>
        At <strong>EmmyBright</strong>, we take immense pride in the quality, style, and craftsmanship of our
        clothing and tailored suits. We want you to feel confident and look your best in every purchase. Please
        read our Return &amp; Exchange Policy carefully before placing your order.
      </p>

      {/* 1 */}
      <section style={styles.cardSection}>
        <h2 style={styles.heading}>1. Policy Overview &amp; Exchange Guarantee</h2>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            <strong>No Cash Refunds:</strong> We do not offer cash refunds for change-of-mind purchases or sizing
            adjustments. Instead, items may be exchanged for another product or a group of products of equal value.
          </li>
          <li style={styles.listItem}>
            <strong>Price Adjustments:</strong> If the requested replacement item is of higher value than the
            original purchase, the balance must be paid prior to dispatch. If the replacement item is of lesser
            value, the remaining balance will be issued as store credit for future purchases.
          </li>
          <li style={styles.listItem}>
            <strong>Refunds:</strong> A refund is only issued when EmmyBright is unable to fulfill your order, for
            example if an item goes out of stock after payment has been confirmed. In that case, we will contact
            you via WhatsApp or phone call so you can choose another product or receive a refund.
          </li>
        </ul>
      </section>

      {/* 2 */}
      <section style={styles.section}>
        <h2 style={styles.heading}>2. Eligibility Requirements for Exchanges</h2>
        <p style={styles.text}>
          To qualify for an exchange, returned garments must strictly meet the following conditions:
        </p>
        <div className="rp-grid">
          <div style={styles.tile}>
            <span style={styles.tileTitle}>Timeframe</span>
            Requests must be submitted within <strong>3 to 5 business days</strong> of package delivery.
          </div>
          <div style={styles.tile}>
            <span style={styles.tileTitle}>Condition</span>
            Items must be unworn, unwashed, unaltered, undamaged, and free from stains or perfume odors.
          </div>
          <div style={styles.tile}>
            <span style={styles.tileTitle}>Packaging &amp; Tags</span>
            All original brand tags, suit covers, hangers, and packaging must remain attached and intact.
          </div>
          <div style={styles.tile}>
            <span style={styles.tileTitle}>Proof of Purchase</span>
            A valid order number, receipt, or email verification is required for processing.
          </div>
        </div>
        <p style={styles.note}>
          *Note: Items that show signs of wear, alteration, or damage upon inspection will be sent back to the
          customer and will not be eligible for an exchange.
        </p>
      </section>

      {/* 3 */}
      <section style={styles.cardSection}>
        <h2 style={styles.heading}>3. Shipping &amp; Logistics Terms</h2>

        <div style={{ ...styles.callout, borderLeftColor: '#2e7d32' }}>
          <h3 style={styles.subHeading}>Defective or Incorrect Orders</h3>
          <p style={styles.calloutText}>
            If you received an item that is damaged, defective, or incorrect due to an error on our part,{' '}
            <strong>EmmyBright will cover all associated return and reshipping costs</strong>, and we will promptly
            exchange the item for you.
          </p>
        </div>

        <div style={{ ...styles.callout, borderLeftColor: '#b36b00' }}>
          <h3 style={styles.subHeading}>Change of Mind / Standard Exchanges</h3>
          <p style={styles.calloutText}>
            For standard exchanges (such as selecting a different size or style),{' '}
            <strong>the customer is responsible for the shipping fees</strong> incurred when returning the item to
            our facility as well as the reshipping fee for the new item.
          </p>
        </div>

        <p style={styles.smallText}>
          Full payment for the original order must be completed and verified before any replacement delivery is
          processed or dispatched.
        </p>
      </section>

      {/* 4 */}
      <section style={styles.section}>
        <h2 style={styles.heading}>4. Non-Exchangeable Items</h2>
        <p style={styles.text}>
          For health, hygiene, and promotional reasons, the following items cannot be returned or exchanged:
        </p>
        <div style={styles.pillRow}>
          <span style={styles.pill}>Clearance / Final Sale items</span>
          <span style={styles.pill}>Underwear, Innerwear &amp; Socks</span>
        </div>
      </section>

      {/* 5 */}
      <section style={styles.contactSection}>
        <h2 style={styles.contactHeading}>5. How to Initiate an Exchange</h2>
        <p style={styles.contactIntro}>
          To start an exchange request, please reach out to our customer support team within 3 to 5 days of
          receiving your delivery:
        </p>

        <div className="rp-grid">
          <div style={styles.contactTile}>
            <span style={styles.contactLabel}>Email Support</span>
            {SUPPORT_EMAILS.map((email) => (
              <a
                key={email}
                href={`mailto:${email}`}
                className="rp-link"
                style={{ ...styles.contactLink, display: 'block' }}
              >
                {email}
              </a>
            ))}
          </div>
          <div style={styles.contactTile}>
            <span style={styles.contactLabel}>WhatsApp Support</span>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rp-link"
              style={styles.contactLink}
            >
              {WHATSAPP_DISPLAY}
            </a>
          </div>
        </div>

        <p style={styles.contactFoot}>
          Please include your <strong style={{ color: '#ffffff' }}>Order Number</strong>, clear photos showing the
          condition of the garment and attached tags, and details of the replacement item or size required.
        </p>
      </section>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: '900px',
    margin: '32px auto 40px',
    padding: '0 20px',
    color: '#333333',
    lineHeight: 1.7,
    textAlign: 'left'
  },
  backLink: {
    display: 'inline-block',
    marginBottom: '22px',
    color: '#111111',
    fontWeight: 600,
    fontSize: '14px',
    textDecoration: 'none'
  },
  header: {
    borderBottom: '1px solid #eaeaea',
    paddingBottom: '16px',
    marginBottom: '26px'
  },
  title: {
    margin: '0 0 6px',
    fontSize: 'clamp(24px, 4vw, 34px)',
    fontWeight: 800,
    letterSpacing: '-0.5px',
    color: '#111111',
    lineHeight: 1.2
  },
  updated: {
    margin: 0,
    fontSize: '13px',
    color: '#777777'
  },
  updatedBrand: {
    color: '#444444'
  },
  intro: {
    margin: '0 0 28px',
    fontSize: '15px',
    color: '#444444'
  },
  section: {
    marginBottom: '30px'
  },
  cardSection: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#ffffff',
    border: '1px solid #e8e8e8',
    borderRadius: '10px'
  },
  heading: {
    margin: '0 0 12px',
    fontSize: '19px',
    fontWeight: 700,
    color: '#1a1a1a',
    lineHeight: 1.3
  },
  subHeading: {
    margin: '0 0 4px',
    fontSize: '15px',
    fontWeight: 700,
    color: '#1a1a1a'
  },
  text: {
    margin: '0 0 14px',
    fontSize: '15px',
    color: '#4a4a4a'
  },
  list: {
    margin: 0,
    paddingLeft: '20px'
  },
  listItem: {
    marginBottom: '10px',
    fontSize: '15px',
    color: '#4a4a4a'
  },
  tile: {
    padding: '14px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e2e2',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#4a4a4a',
    lineHeight: 1.6
  },
  tileTitle: {
    display: 'block',
    marginBottom: '3px',
    fontSize: '14px',
    fontWeight: 700,
    color: '#1a1a1a'
  },
  note: {
    margin: '12px 0 0',
    fontSize: '12.5px',
    fontStyle: 'italic',
    color: '#666666'
  },
  callout: {
    marginBottom: '12px',
    padding: '14px 16px',
    backgroundColor: '#fafafa',
    border: '1px solid #ececec',
    borderLeft: '4px solid #1a1a1a',
    borderRadius: '0 8px 8px 0'
  },
  calloutText: {
    margin: 0,
    fontSize: '14.5px',
    color: '#4a4a4a'
  },
  smallText: {
    margin: '4px 0 0',
    fontSize: '12.5px',
    color: '#666666'
  },
  pillRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px'
  },
  pill: {
    display: 'inline-block',
    padding: '6px 14px',
    border: '1px solid #c62828',
    borderRadius: '999px',
    backgroundColor: '#fdf0f0',
    color: '#b71c1c',
    fontSize: '12.5px',
    fontWeight: 600,
    lineHeight: 1.4
  },
  contactSection: {
    padding: '24px 20px',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    borderRadius: '12px'
  },
  contactHeading: {
    margin: '0 0 8px',
    fontSize: '21px',
    fontWeight: 700,
    color: '#ffffff'
  },
  contactIntro: {
    margin: '0 0 18px',
    fontSize: '14px',
    color: '#cfcfcf'
  },
  contactTile: {
    padding: '14px 16px',
    backgroundColor: '#2b2b2b',
    border: '1px solid #3d3d3d',
    borderRadius: '10px',
    minWidth: 0
  },
  contactLabel: {
    display: 'block',
    marginBottom: '4px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: '#a8a8a8'
  },
  contactLink: {
    color: '#ffffff',
    fontSize: '14.5px',
    fontWeight: 600,
    textDecoration: 'none',
    overflowWrap: 'anywhere'
  },
  contactFoot: {
    margin: '18px 0 0',
    fontSize: '12.5px',
    color: '#bdbdbd'
  }
};

export default ReturnPolicy;