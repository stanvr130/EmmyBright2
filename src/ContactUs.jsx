import React from 'react';

function ContactUs() {
  const phoneNumber = '07069993785';
  const whatsappNumber = '08139108077';
  const whatsappLink = `https://wa.me/234${whatsappNumber.slice(1)}`;
  const address = 'EmmyBright Plaza, Dugbe Queen Cinema, Ibadan';
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        <div style={styles.headerGroup}>
          <span style={styles.brandBadge}>GET IN TOUCH</span>
          <h1 style={styles.pageTitle}>Contact Us</h1>
          <p style={styles.pageSubtitle}>
            Questions about an order, a fitting, or a bespoke piece? Reach us directly below.
          </p>
        </div>

        <div style={styles.cardsGrid}>
          <a href={`tel:${phoneNumber}`} style={styles.contactCard}>
            <div style={styles.iconWrapper}>
              <PhoneIcon />
            </div>
            <div style={styles.cardTextGroup}>
              <h3 style={styles.cardTitle}>Call Us</h3>
              <p style={styles.cardDetail}>{phoneNumber}</p>
            </div>
          </a>

          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" style={styles.contactCard}>
            <div style={styles.iconWrapper}>
              <WhatsappIcon />
            </div>
            <div style={styles.cardTextGroup}>
              <h3 style={styles.cardTitle}>Chat on WhatsApp</h3>
              <p style={styles.cardDetail}>{whatsappNumber}</p>
            </div>
          </a>

          <a href={mapsLink} target="_blank" rel="noopener noreferrer" style={styles.contactCard}>
            <div style={styles.iconWrapper}>
              <LocationIcon />
            </div>
            <div style={styles.cardTextGroup}>
              <h3 style={styles.cardTitle}>Main Branch</h3>
              <p style={styles.cardDetail}>{address}</p>
            </div>
          </a>
        </div>

        <p style={styles.footNoteText}>your Satisfaction is our number 1 Priority.</p>
      </div>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#111111">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.837.494 3.6 1.417 5.157L2 22l5.06-1.527a9.9 9.9 0 0 0 4.98 1.34h.005c5.46 0 9.912-4.45 9.912-9.91C21.957 6.45 17.5 2 12.04 2zm0 18.006h-.004a8.1 8.1 0 0 1-4.13-1.13l-.296-.176-3.005.906.902-2.93-.192-.303a8.08 8.08 0 0 1-1.24-4.32c0-4.48 3.65-8.13 8.14-8.13a8.08 8.08 0 0 1 5.756 2.383 8.08 8.08 0 0 1 2.377 5.75c0 4.48-3.65 8.13-8.13 8.13z" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: '#FAF9F6',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '48px 16px',
    boxSizing: 'border-box',
  },
  container: {
    width: '100%',
    maxWidth: '620px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #EAEAEA',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
    padding: '48px 40px',
    boxSizing: 'border-box',
  },
  headerGroup: {
    textAlign: 'center',
    marginBottom: '36px',
  },
  brandBadge: {
    fontSize: '10px',
    letterSpacing: '2px',
    color: '#888888',
    textTransform: 'uppercase',
    marginBottom: '10px',
    display: 'inline-block',
  },
  pageTitle: {
    fontFamily: '"Didot", "Bodoni MT", "Cinzel", "Georgia", serif',
    fontSize: '28px',
    fontWeight: '400',
    letterSpacing: '1px',
    color: '#111111',
    margin: '0 0 10px 0',
  },
  pageSubtitle: {
    fontSize: '13px',
    color: '#666666',
    lineHeight: '1.5',
    margin: '0 auto',
    maxWidth: '420px',
  },
  cardsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  contactCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '18px 20px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FAFAFA',
    textDecoration: 'none',
  },
  iconWrapper: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTextGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#111111',
    margin: '0 0 4px 0',
    letterSpacing: '0.2px',
  },
  cardDetail: {
    fontSize: '14px',
    color: '#444444',
    margin: 0,
  },
  footNoteText: {
    marginTop: '32px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#999999',
  },
};

export default ContactUs;