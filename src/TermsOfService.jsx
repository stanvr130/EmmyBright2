import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <Link to="/" style={styles.backLink}>← Back to Shop</Link>
      </div>

      <h1 style={styles.title}>Terms of Service</h1>
      <p style={styles.lastUpdated}>Last updated: September 23, 2026</p>

      <p style={styles.intro}>
        Welcome to EmmyBright. By placing an order with us, you agree to the following terms.
      </p>

      <section style={styles.section}>
        <h2 style={styles.sectionHeading}>1. Pricing</h2>
        <p style={styles.text}>
          All prices are listed in Nigerian Naira (₦) and are subject to change without notice.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionHeading}>2. Orders & Payment</h2>
        <p style={styles.text}>
          Payment is processed securely via Paystack. An order is only confirmed once payment has been successfully verified.
        </p>
        <p style={styles.text}>
          If an item goes out of stock after payment has already been confirmed, the customer will be contacted via WhatsApp or phone call to either choose an alternative product or receive a refund. Refunds are only issued in this situation — where EmmyBright is unable to fulfill the order — and not for change-of-mind purchases.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionHeading}>3. Delivery</h2>
        <ul style={styles.list}>
          <li style={styles.listItem}>Within Oyo State (Ibadan): 1–2 business days</li>
          <li style={styles.listItem}>Express delivery (Ibadan): within 1 business day</li>
          <li style={styles.listItem}>Outside Oyo State: 3–4 business days</li>
        </ul>
        <p style={styles.text}>
          If a delivery attempt fails because the customer is unavailable or provided an incorrect address, an additional delivery fee will apply for the next attempt.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionHeading}>4. Sizing</h2>
        <p style={styles.text}>
          If you're unsure of your size, contact us on WhatsApp before placing your order. EmmyBright is not responsible for exchanges resulting from a customer selecting the wrong size after confirming their own measurements.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionHeading}>5. Exchanges</h2>
        <p style={styles.text}>
          We do not offer refunds for change-of-mind purchases. Instead, items may be exchanged for another product or a group of products of equal value to the original purchase.
        </p>
        <ul style={styles.list}>
          <li style={styles.listItem}>Exchange requests must be made within 3–5 days of delivery.</li>
          <li style={styles.listItem}>Items must be unworn, unused, with tags attached and in their original packaging.</li>
          <li style={styles.listItem}>EmmyBright covers the cost of reshipping the replacement item to the customer.</li>
          <li style={styles.listItem}>Full payment for the original order must be completed before any exchange delivery is carried out.</li>
        </ul>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionHeading}>6. Account & Conduct</h2>
        <p style={styles.text}>
          Customers must provide accurate account information. One account is permitted per person. EmmyBright reserves the right to refuse or cancel any order suspected of fraud or misuse.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionHeading}>7. Changes to These Terms</h2>
        <p style={styles.text}>
          EmmyBright may update these Terms of Service at any time. The version published on this page at the time of your order is the version that applies.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionHeading}>8. Governing Law</h2>
        <p style={styles.text}>
          These terms are governed by the laws of the Federal Republic of Nigeria.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionHeading}>9. Contact</h2>
        <p style={styles.text}>
          For questions about these terms, exchanges, or an existing order, reach us via WhatsApp or email at{' '}
          <a href="mailto:rotannamario@gmail.com" style={styles.link}>rotannamario@gmail.com</a>, or visit our{' '}
          <Link to="/contact" style={styles.link}>Contact Us</Link> page.
        </p>
      </section>
    </div>
  );
}

const styles = {
  page: { maxWidth: '760px', margin: '0 auto', padding: '24px 16px 60px' },
  topBar: { marginBottom: '20px' },
  backLink: { textDecoration: 'none', color: '#555', fontSize: '14px', fontWeight: '600' },
  title: { fontSize: '26px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px 0' },
  lastUpdated: { fontSize: '13px', color: '#888', margin: '0 0 24px 0' },
  intro: { fontSize: '15px', color: '#333', lineHeight: '1.6', marginBottom: '28px' },
  section: { marginBottom: '26px' },
  sectionHeading: { fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 10px 0' },
  text: { fontSize: '14px', color: '#444', lineHeight: '1.7', margin: '0 0 10px 0' },
  list: { margin: '0 0 10px 0', paddingLeft: '20px' },
  listItem: { fontSize: '14px', color: '#444', lineHeight: '1.7', marginBottom: '4px' },
  link: { color: '#1a1a1a', fontWeight: '600', textDecoration: 'underline' }
};