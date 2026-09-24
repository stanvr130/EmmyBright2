import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        <div className="logo-text" style={styles.brand}>EmmyBright</div>

        <nav style={styles.linksRow}>
          <Link to="/contact" style={styles.link}>Contact Us</Link>
          <span style={styles.divider}>•</span>
          <Link to="/terms" style={styles.link}>Terms of Service</Link>
          <span style={styles.divider}>•</span>
          <Link to="/privacy" style={styles.link}>Privacy Policy</Link>
        </nav>

        <p style={styles.copyright}>
          © {new Date().getFullYear()} EmmyBright. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    backgroundColor: '#f2f2f2',
    borderTop: '1px solid #e0e0e0',
    marginTop: '40px',
    padding: '28px 16px'
  },
  inner: {
    maxWidth: '900px',
    margin: '0 auto',
    textAlign: 'center'
  },
  brand: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '10px'
  },
  linksRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
    flexWrap: 'wrap'
  },
  link: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#444',
    textDecoration: 'none'
  },
  divider: {
    color: '#bbb',
    fontSize: '12px'
  },
  copyright: {
    fontSize: '12px',
    color: '#888',
    margin: 0
  }
};