import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

function PrivacyPolicy() {
  // Scroll to top when page opens
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const pageContainerStyle = {
    maxWidth: '900px',
    margin: '40px auto',
    padding: '0 20px',
    fontFamily: 'inherit',
    color: '#333',
    lineHeight: '1.7'
  };

  const titleStyle = {
    fontSize: '32px',
    fontWeight: '800',
    marginBottom: '8px',
    color: '#111',
    letterSpacing: '-0.5px'
  };

  const subtitleStyle = {
    fontSize: '14px',
    color: '#777',
    marginBottom: '32px',
    borderBottom: '1px solid #eaeaea',
    paddingBottom: '16px'
  };

  const sectionStyle = {
    marginBottom: '32px'
  };

  const headingStyle = {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '12px',
    color: '#1a1a1a'
  };

  const paragraphStyle = {
    marginBottom: '12px',
    fontSize: '15px',
    color: '#4a4a4a'
  };

  const listStyle = {
    paddingLeft: '20px',
    marginBottom: '16px',
    color: '#4a4a4a',
    fontSize: '15px'
  };

  const listItemStyle = {
    marginBottom: '8px'
  };

  const backLinkStyle = {
    display: 'inline-block',
    marginBottom: '24px',
    color: '#111',
    fontWeight: '600',
    textDecoration: 'none',
    fontSize: '14px'
  };

  return (
    <div style={pageContainerStyle}>
      <Link to="/" style={backLinkStyle}>
        ← Back to Shop
      </Link>

      <h1 style={titleStyle}>Privacy Policy</h1>
      <p style={subtitleStyle}>
        <strong>Effective Date:</strong> September 24, 2026 | <strong>Last Updated:</strong> September 24, 2026
      </p>

      <div style={sectionStyle}>
        <p style={paragraphStyle}>
          At <strong>EmmyBright</strong> , protecting the privacy and security of our customers and site visitors ("you" or "your") is a top priority.
        </p>
        <p style={paragraphStyle}>
          This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you visit or make a purchase from our website.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>1. Information We Collect</h2>
        <p style={paragraphStyle}>
          We collect information directly from you when you browse our site, create an account, or make a purchase, as well as automatically through your interaction with our platform.
        </p>

        <h3 style={{ ...headingStyle, fontSize: '16px', marginTop: '16px' }}>A. Information You Provide Directly</h3>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            <strong>Account Information:</strong> Full name, email address, password, and phone number when registering for an account.
          </li>
          <li style={listItemStyle}>
            <strong>Order & Shipping Details:</strong> Delivery addresses, recipient details, contact telephone numbers, and order preferences submitted during checkout.
          </li>
          <li style={listItemStyle}>
            <strong>Payment Information:</strong> Transaction details required to process payments. <em>Note: We do not store full credit card numbers or PINs on our servers. All payments are processed securely through third-party payment gateways (such as Paystack).</em>
          </li>
          <li style={listItemStyle}>
            <strong>Saved Preferences:</strong> Products saved to your Wishlist or Cart.
          </li>
          <li style={listItemStyle}>
            <strong>Customer Support & Inquiries:</strong> Any information or correspondence provided when reaching out to us via our Contact Us page.
          </li>
        </ul>

        <h3 style={{ ...headingStyle, fontSize: '16px', marginTop: '16px' }}>B. Information Collected Automatically</h3>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            <strong>Log Data & Device Info:</strong> Your IP address, browser type, operating system, and hardware details.
          </li>
          <li style={listItemStyle}>
            <strong>Usage Data:</strong> Pages viewed, items searched, products added to cart, time spent on pages, and navigation paths.
          </li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>2. How We Use Your Information</h2>
        <p style={paragraphStyle}>We use the information we collect for the following operational and business purposes:</p>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            <strong>Order Fulfillment:</strong> To process transactions, manage carts, deliver orders to your specified address, and provide delivery status updates.
          </li>
          <li style={listItemStyle}>
            <strong>Account Management:</strong> To maintain your user account, authenticate your login credentials, and save your Wishlist and Cart preferences across sessions.
          </li>
          <li style={listItemStyle}>
            <strong>Customer Support:</strong> To respond to your questions, process requests, or address order issues.
          </li>
          <li style={listItemStyle}>
            <strong>Service Improvement:</strong> To analyze user behavior, fix bugs, and optimize website layout and performance.
          </li>
          <li style={listItemStyle}>
            <strong>Security & Fraud Prevention:</strong> To verify transactions, prevent fraudulent activity, and ensure site integrity.
          </li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>3. How We Share Your Information</h2>
        <p style={paragraphStyle}>
          We do <strong>not</strong> sell, rent, or trade your personal information. We only share data with trusted service providers necessary to operate our store:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            <strong>Payment Processors:</strong> Payment gateways (e.g., Paystack) to process transaction amounts safely and verify payments.
          </li>
          <li style={listItemStyle}>
            <strong>Logistics & Delivery Partners:</strong> Couriers and delivery agents so they can bring your orders to your delivery address.
          </li>
          <li style={listItemStyle}>
            <strong>Hosting & Infrastructure Services:</strong> Cloud infrastructure and database providers that securely host our site database and application files.
          </li>
          <li style={listItemStyle}>
            <strong>Legal Requirements:</strong> If required by applicable laws, regulations, or legal processes to enforce our Terms of Service or protect the rights and safety of EmmyBright and our users.
          </li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>4. Data Storage, Security, and Retention</h2>
        <p style={paragraphStyle}>
          <strong>Security:</strong> We use encrypted connections (HTTPS/SSL), secure database configurations, and standard web security practices to protect your information.
        </p>
        <p style={paragraphStyle}>
          <strong>Retention:</strong> We keep your account information and order history for as long as your account remains active or as needed to provide you services, fulfill tax/regulatory obligations, and resolve disputes.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>5. Your Data Rights</h2>
        <p style={paragraphStyle}>
          Depending on your jurisdiction (such as under the Nigeria Data Protection Act or applicable local data protection laws), you have rights regarding your personal data:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            <strong>Access:</strong> Request details about the personal data we hold about you.
          </li>
          <li style={listItemStyle}>
            <strong>Correction:</strong> Update or correct your personal details at any time via your Account Page.
          </li>
          <li style={listItemStyle}>
            <strong>Deletion:</strong> Request the removal of your personal account data by contacting our support team.
          </li>
          <li style={listItemStyle}>
            <strong>Opt-Out:</strong> Stop receiving promotional communications by following unsubscribe instructions in emails or contacting us directly.
          </li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>6. Third-Party Links</h2>
        <p style={paragraphStyle}>
          Our website may contain links to third-party services or external websites. We are not responsible for the privacy practices or content of those external sites. We encourage you to review their privacy policies when leaving our site.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>7. Children's Privacy</h2>
        <p style={paragraphStyle}>
          EmmyBright does not knowingly collect personal data from children under 13 years of age. If you believe a child has provided us with personal information, please contact us immediately so we can remove it.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>8. Updates to This Policy</h2>
        <p style={paragraphStyle}>
          We may update this Privacy Policy periodically to reflect changes in our services or legal regulations. The updated version will be indicated by the "Last Updated" date at the top of this page.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>9. Contact Us</h2>
        <p style={paragraphStyle}>
          If you have questions, concerns, or requests regarding this Privacy Policy, please contact us via our website's <Link to="/contact" style={{ color: '#111', textDecoration: 'underline' }}>Contact Us</Link> page.
        </p>
      </div>
    </div>
  );
}

export default PrivacyPolicy;