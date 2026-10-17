import React from 'react';
import { Link } from 'react-router-dom';

const WHATSAPP_NUMBER = '2348139108077'; // 08139108077 in international format

const PERKS = [
  { icon: '🚚', title: 'Quick delivery', text: 'Ibadan in 1–2 days, express within a day. 3–4 days outside Oyo State.' },
  { icon: '🪡', title: 'Bespoke tailoring', text: 'Italian and Turkish tailoring, made to impress.' },
  { icon: '💬', title: 'Sizing help', text: 'Not sure of your size? Chat with us on WhatsApp.' },
  { icon: '🔒', title: 'Secure payment', text: 'Pay safely through Paystack.' }
];

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M16.004 3C9.374 3 4 8.373 4 15.002c0 2.455.726 4.738 1.976 6.654L4 29l7.52-1.937a11.94 11.94 0 0 0 4.484.874h.001c6.63 0 12.003-5.373 12.003-12.002C28.008 8.373 22.635 3 16.004 3zm0 21.726a9.69 9.69 0 0 1-4.94-1.354l-.354-.21-4.463 1.15 1.19-4.35-.23-.366a9.68 9.68 0 0 1-1.49-5.194c0-5.362 4.364-9.726 9.73-9.726 5.364 0 9.726 4.363 9.726 9.726 0 5.364-4.362 9.726-9.73 9.726l.057-.002zm5.34-7.287c-.293-.147-1.735-.857-2.004-.955-.27-.098-.466-.147-.662.147-.195.293-.76.955-.932 1.15-.172.196-.343.22-.636.073-.293-.147-1.237-.456-2.356-1.455-.871-.777-1.459-1.737-1.63-2.03-.172-.293-.018-.452.129-.598.133-.132.293-.343.44-.515.146-.172.195-.293.293-.49.098-.195.049-.367-.025-.514-.073-.147-.661-1.595-.906-2.184-.238-.572-.48-.494-.661-.503l-.562-.01c-.195 0-.514.073-.783.367-.27.293-1.03 1.007-1.03 2.456 0 1.448 1.055 2.848 1.202 3.044.146.195 2.077 3.173 5.034 4.449.703.303 1.252.484 1.68.62.706.224 1.348.192 1.856.117.566-.085 1.735-.709 1.98-1.393.244-.684.244-1.27.171-1.393-.073-.122-.268-.195-.561-.342z" />
    </svg>
  );
}

const SOCIALS = [
  {
    key: 'instagram-plaza',
    label: 'Instagram · Plaza',
    aria: 'EmmyBright Plaza on Instagram',
    href: 'https://www.instagram.com/emmybrightplaza?exln=bmFkdzd1ZW5qb2Mx',
    Icon: InstagramIcon
  },
  {
    key: 'instagram-suits',
    label: 'Instagram · Suits',
    aria: 'EmmyBright Suits and Clothings on Instagram',
    href: 'https://www.instagram.com/emmybrightsuitsandclothings1?srtk=a2swbWNwdXFleHcz',
    Icon: InstagramIcon
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    aria: 'EmmyBright Plaza on TikTok',
    href: 'https://www.tiktok.com/@emmybrightplaza?_r=1&_t=ZS-9AbE5bbqQQE',
    Icon: TikTokIcon
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    aria: 'Chat with EmmyBright on WhatsApp',
    href: `https://wa.me/${WHATSAPP_NUMBER}`,
    Icon: WhatsAppIcon
  }
];

const footerCSS = `
  .eb-footer-inner,
  .eb-footer-inner * {
    box-sizing: border-box;
  }

  /* Highlights: 4 across on desktop, 2 across on tablets/phones, 1 on tiny screens */
  .eb-perks {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px 18px;
    max-width: 1100px;
    margin: 0 auto;
  }
  .eb-perk {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    min-width: 0;
  }
  .eb-perk-head {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-bottom: 3px;
  }
  .eb-perk-icon {
    font-size: 17px;
    line-height: 1;
  }
  .eb-perk-title {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: #1a1a1a;
  }
  .eb-perk-text {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: #666;
    overflow-wrap: anywhere;
  }

  .eb-rule {
    height: 1px;
    background: #dcdcdc;
    max-width: 1100px;
    margin: 16px auto;
  }

  /* Social pills */
  .eb-socials {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 12px;
  }
  .eb-social {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: 1px solid #1a1a1a;
    border-radius: 999px;
    background: #ffffff;
    color: #1a1a1a;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    text-decoration: none;
    white-space: nowrap;
    transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
  }
  .eb-social:hover,
  .eb-social:focus-visible {
    background: #1a1a1a;
    color: #ffffff;
    transform: translateY(-2px);
  }
  .eb-social svg {
    flex-shrink: 0;
  }
  .eb-footer-link:hover {
    text-decoration: underline !important;
  }

  @media (max-width: 899px) {
    .eb-perks {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 340px) {
    .eb-perks {
      grid-template-columns: 1fr;
    }
    .eb-social {
      padding: 6px 10px;
      font-size: 11.5px;
    }
  }
`;

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <style>{footerCSS}</style>

      <div className="eb-footer-inner" style={styles.inner}>
        {/* Highlights (moved here from the landing page) */}
        <div className="eb-perks">
          {PERKS.map((perk) => (
            <div className="eb-perk" key={perk.title}>
              <div className="eb-perk-head">
                <span className="eb-perk-icon" aria-hidden="true">{perk.icon}</span>
                <h3 className="eb-perk-title">{perk.title}</h3>
              </div>
              <p className="eb-perk-text">{perk.text}</p>
            </div>
          ))}
        </div>

        <div className="eb-rule" />

        <div className="logo-text" style={styles.brand}>EmmyBright</div>

        {/* Social links */}
        <div className="eb-socials">
          {SOCIALS.map(({ key, label, aria, href, Icon }) => (
            <a
              key={key}
              className="eb-social"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={aria}
            >
              <Icon />
              <span>{label}</span>
            </a>
          ))}
        </div>

   <nav style={styles.linksRow}>
  <Link to="/contact" className="eb-footer-link" style={styles.link}>Contact Us</Link>
  <span style={styles.divider}>•</span>
  <Link to="/terms" className="eb-footer-link" style={styles.link}>Terms of Service</Link>
  <span style={styles.divider}>•</span>
  <Link to="/returns" className="eb-footer-link" style={styles.link}>Return Policy</Link>
  <span style={styles.divider}>•</span>
  <Link to="/privacy" className="eb-footer-link" style={styles.link}>Privacy Policy</Link>
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
    maxWidth: '1800px',
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

// TXT
// resend._domainkey
// p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZC+bkBe5KzYi/x0nnEXx1J6mvm1O6flDcbnhuSSq1gCImU8sIlwme6aI1xD/djxGa7b7NeGA1xCQ3dz6hcaAAs1kHfMS/iCyswsoskQQtEjfZYUauoLfqwsQvpyGWpMPdPd9+2MmCxWUFU1vKLWEUNOw3Fg3cXEy+hz2OaHsSJQIDAQAB
// Auto
// Type	Name	Content	TTL
// CNAME
// rsend
// rsend-euw1.forge.rmta.net
// Auto
// CNAME
// send
// send.forge.rmta.net
// Auto