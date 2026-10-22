import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from './api/api';

const WHATSAPP_URL = 'https://wa.me/2348139108077';

// Delivery windows in BUSINESS days (Mon–Fri), taken from your Terms of Service:
// Ibadan / Oyo State: 1–2 days. Everywhere else: 3–4 days.
// Change these numbers to adjust every estimate shown to customers.
const DELIVERY_WINDOWS = {
  oyo: [1, 2],
  other: [3, 4]
};

/* ---------- Icons (inline SVG, they inherit the text colour) ---------- */
function Icon({ size = 16, children, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0, ...style }}
    >
      {children}
    </svg>
  );
}

const MapPinIcon = (p) => (
  <Icon {...p}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </Icon>
);
const CardIcon = (p) => (
  <Icon {...p}>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </Icon>
);
const PackageIcon = (p) => (
  <Icon {...p}>
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </Icon>
);
const TruckIcon = (p) => (
  <Icon {...p}>
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </Icon>
);
const CalendarIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </Icon>
);
const ClockIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </Icon>
);
const CheckCircleIcon = (p) => (
  <Icon {...p}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </Icon>
);
const XCircleIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </Icon>
);
const AlertIcon = (p) => (
  <Icon {...p}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </Icon>
);
const LoaderIcon = (p) => (
  <Icon {...p}>
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </Icon>
);
const LogOutIcon = (p) => (
  <Icon {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </Icon>
);
const ChevronDownIcon = (p) => (
  <Icon {...p}>
    <polyline points="6 9 12 15 18 9" />
  </Icon>
);
const ChevronLeftIcon = (p) => (
  <Icon {...p}>
    <polyline points="15 18 9 12 15 6" />
  </Icon>
);

/* ---------- Order status ---------- */
const STATUS_META = {
  PENDING:    { label: 'Pending',    bg: '#fff4e5', color: '#9a5b00', Icon: ClockIcon },
  PROCESSING: { label: 'Processing', bg: '#e8f0fe', color: '#1a56db', Icon: PackageIcon },
  SHIPPED:    { label: 'Shipped',    bg: '#e6f4ea', color: '#137333', Icon: TruckIcon },
  DELIVERED:  { label: 'Delivered',  bg: '#e6f4ea', color: '#137333', Icon: CheckCircleIcon },
  CANCELLED:  { label: 'Cancelled',  bg: '#fce8e6', color: '#c5221f', Icon: XCircleIcon }
};

/* ---------- Delivery estimate ---------- */
const isOyoAddress = (address) => /\b(ibadan|oyo)\b/i.test(address || '');

// Adds business days (Mon–Fri), skipping Saturdays and Sundays
const addBusinessDays = (start, days) => {
  const d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return d;
};

const formatDay = (date) =>
  date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

const getDeliveryEstimate = (order) => {
  if (!order.createdAt) return null;
  const ordered = new Date(order.createdAt);
  const [minDays, maxDays] = isOyoAddress(order.shippingAddress)
    ? DELIVERY_WINDOWS.oyo
    : DELIVERY_WINDOWS.other;

  const from = addBusinessDays(ordered, minDays);
  const to = addBusinessDays(ordered, maxDays);

  const endOfWindow = new Date(to);
  endOfWindow.setHours(23, 59, 59, 999);

  return {
    text: `${formatDay(from)} – ${formatDay(to)}`,
    isLate: new Date() > endOfWindow
  };
};

const pageCSS = `
  @keyframes ap-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .ap-spin { animation: ap-spin 1s linear infinite; }
  .ap-details-btn:hover { background: #1a1a1a !important; color: #ffffff !important; }
  .ap-back:hover, .ap-wa:hover { text-decoration: underline; }
  .ap-logout:hover { background: #c5221f !important; color: #ffffff !important; }
  @media (max-width: 480px) {
    .ap-order-bottom { flex-direction: column; align-items: stretch !important; gap: 10px !important; }
    .ap-details-btn { justify-content: center; }
  }
`;

function AccountPage({ user, onLogout, clearCart, backendUrl = 'http://localhost:5000' }) {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState(null);

  // Guard to prevent re-verifying the same reference in loops
  const verifiedRef = useRef(null);

  const fetchOrders = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/orders/myorders', { signal });
      const data = response.data;
      setOrders(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      console.error('Error fetching order history:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Could not load your order history right now.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    const isVerifyFlow = searchParams.get('payment_verify') === 'true' || Boolean(reference);

    const handlePostPaymentVerification = async () => {
      if (isVerifyFlow && reference && verifiedRef.current !== reference) {
        verifiedRef.current = reference;
        setIsVerifying(true);
        setVerificationFeedback({ success: true, message: 'Verifying payment status with Paystack...' });

        try {
          const response = await api.get(`/orders/verify-payment?reference=${encodeURIComponent(reference)}`);
          if (response.data?.success) {
            setVerificationFeedback({
              success: true,
              message: `Payment confirmed! Order #${response.data.order?.id || ''} is now being processed.`
            });

            if (typeof clearCart === 'function') {
              clearCart();
            }
            localStorage.removeItem('cartItems');
          } else {
            setVerificationFeedback({
              success: false,
              message: response.data?.error || 'Payment verification failed.'
            });
          }
        } catch (err) {
          console.error('Payment verification error:', err);
          setVerificationFeedback({
            success: false,
            message: err.response?.data?.error || 'An error occurred while verifying your payment.'
          });
        } finally {
          setIsVerifying(false);
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }

      fetchOrders(controller.signal);
    };

    handlePostPaymentVerification();

    return () => controller.abort();
  }, [fetchOrders, searchParams]); // clearCart omitted on purpose (ref guard above)

  const toggleExpand = (id) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('blob:')) {
      return imagePath;
    }
    let cleanPath = imagePath;
    if (!cleanPath.startsWith('/public-images') && !cleanPath.startsWith('/')) {
      cleanPath = `/public-images/${cleanPath}`;
    } else if (!cleanPath.startsWith('/public-images')) {
      cleanPath = `/public-images${cleanPath}`;
    }
    return `${backendUrl}${cleanPath}`;
  };

  const paidOrders = orders.filter(o => o.paymentStatus === 'PAID');
  const activeOrders = paidOrders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status));
  const pastOrders = paidOrders.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.status));

  const renderOrderRow = (order) => {
    const isExpanded = expandedOrderId === order.id;
    const items = order.orderItems || [];
    const meta = STATUS_META[order.status] || STATUS_META.PENDING;
    const StatusIcon = meta.Icon;

    const itemsSubtotal = Number(order.totalAmount || 0);
    const deliveryFee = Number(order.deliveryFee) || 3000;
    const grandTotal = itemsSubtotal + deliveryFee;

    const showEstimate = ['PENDING', 'PROCESSING', 'SHIPPED'].includes(order.status);
    const estimate = showEstimate ? getDeliveryEstimate(order) : null;

    return (
      <div key={order.id} style={styles.orderCard}>
        {/* Basic details: order no, tracking status, price, show details */}
        <div style={styles.orderTop}>
          <div>
            <span style={styles.orderRef}>Order #{order.id}</span>
            <div style={styles.orderDate}>
              {order.createdAt
                ? new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                : 'N/A'}
            </div>
          </div>

          <span style={{ ...styles.badge, backgroundColor: meta.bg, color: meta.color }}>
            <StatusIcon size={13} />
            {meta.label}
          </span>
        </div>

        {estimate && (
          <div style={styles.eta}>
            <CalendarIcon size={15} style={{ marginTop: '2px' }} />
            <div>
              <span style={styles.etaLabel}>Expected delivery</span>{' '}
              <strong style={styles.etaDates}>{estimate.text}</strong>
              {estimate.isLate && (
                <div style={styles.etaLate}>
                  This order is due about now. If it hasn't reached you,{' '}
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="ap-wa" style={styles.etaLink}>
                    message us on WhatsApp
                  </a>.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="ap-order-bottom" style={styles.orderBottom}>
          <strong style={styles.orderTotal}>₦{grandTotal.toLocaleString()}</strong>
          <button
            type="button"
            className="ap-details-btn"
            style={styles.detailsBtn}
            onClick={() => toggleExpand(order.id)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? 'Hide details' : 'Show details'}
            <ChevronDownIcon
              size={14}
              style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
            />
          </button>
        </div>

        {isExpanded && (
          <div style={styles.orderDetails}>
            <div style={styles.detailsBlock}>
              <h4 style={styles.detailsTitle}>
                <MapPinIcon size={15} /> Delivery details
              </h4>
              <p style={styles.detailsText}><strong>Address:</strong> {order.shippingAddress || 'No address provided'}</p>
              <p style={styles.detailsText}><strong>Phone:</strong> {order.phone || 'No phone provided'}</p>

              <h4 style={{ ...styles.detailsTitle, marginTop: '16px' }}>
                <CardIcon size={15} /> Payment summary
              </h4>
              <p style={styles.detailsText}><strong>Items subtotal:</strong> ₦{itemsSubtotal.toLocaleString()}</p>
              <p style={styles.detailsText}><strong>Delivery fee:</strong> ₦{deliveryFee.toLocaleString()}</p>
              <p style={{ ...styles.detailsText, fontSize: '14px', fontWeight: '700', color: '#1a1a1a', marginTop: '4px' }}>
                <strong>Grand total paid:</strong> ₦{grandTotal.toLocaleString()}
              </p>
            </div>

            <div style={styles.detailsBlock}>
              <h4 style={styles.detailsTitle}>
                <PackageIcon size={15} /> Items purchased ({items.length})
              </h4>
              <ul style={styles.itemList}>
                {items.map((item, itemIdx) => {
                  const productName = item.variant?.product?.name || `Item #${item.variantId || itemIdx}`;
                  const size = item.variant?.size;
                  const color = item.variant?.color;
                  const imageUrl = getImageUrl(item.variant?.product?.image);

                  return (
                    <li key={item.id || itemIdx} style={styles.itemRow}>
                      <div style={styles.itemInfo}>
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={productName}
                            style={styles.itemThumb}
                            title="Click to enlarge"
                            onClick={() => setZoomedImage({ url: imageUrl, name: productName })}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={styles.itemThumbPlaceholder}>—</div>
                        )}
                        <span>
                          <strong>{productName}</strong>
                          {size && ` (Size: ${size})`}
                          {color && ` (Color: ${color})`}
                        </span>
                      </div>
                      <span>{item.quantity} x ₦{Number(item.price || 0).toLocaleString()}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <style>{pageCSS}</style>

      <div style={styles.topBar}>
        <Link to="/" className="ap-back" style={styles.backLink}>
          <ChevronLeftIcon size={16} /> Back to Shop
        </Link>
      </div>

      {verificationFeedback && (
        <div style={{
          ...styles.banner,
          backgroundColor: verificationFeedback.success ? '#e6f4ea' : '#fce8e6',
          color: verificationFeedback.success ? '#137333' : '#c5221f',
          borderColor: verificationFeedback.success ? '#ceead6' : '#fad2cf'
        }}>
          <div style={styles.bannerTextContainer}>
            {isVerifying ? (
              <span className="ap-spin" style={{ display: 'inline-flex' }}><LoaderIcon size={18} /></span>
            ) : verificationFeedback.success ? (
              <CheckCircleIcon size={18} />
            ) : (
              <AlertIcon size={18} />
            )}
            <span>{verificationFeedback.message}</span>
          </div>
          {!isVerifying && (
            <button style={styles.bannerCloseBtn} onClick={() => setVerificationFeedback(null)}>
              Dismiss
            </button>
          )}
        </div>
      )}

      <section style={styles.profileCard}>
        <div style={styles.avatarCircle}>
          {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <h1 style={styles.profileName}>{user?.name || 'Valued Customer'}</h1>
          <p style={styles.profileEmail}>{user?.email}</p>
          {user?.phone && <p style={styles.profileEmail}>{user.phone}</p>}
        </div>
      </section>

      <div style={styles.ordersSection}>
        <h2 style={styles.sectionHeading}>Current Orders</h2>
        {loading ? (
          <p style={styles.mutedText}>Loading your orders...</p>
        ) : error ? (
          <div style={styles.errorBanner}>{error}</div>
        ) : activeOrders.length === 0 ? (
          <p style={styles.mutedText}>You have no active orders right now.</p>
        ) : (
          <div style={styles.orderList}>
            {activeOrders.map(renderOrderRow)}
          </div>
        )}

        <h2 style={{ ...styles.sectionHeading, marginTop: '32px' }}>Past Orders</h2>
        {!loading && !error && (
          pastOrders.length === 0 ? (
            <p style={styles.mutedText}>No completed or cancelled orders yet.</p>
          ) : (
            <div style={styles.orderList}>
              {pastOrders.map(renderOrderRow)}
            </div>
          )
        )}
      </div>

      <div style={styles.logoutSection}>
        <button className="ap-logout" style={styles.logoutBtn} onClick={onLogout}>
          <LogOutIcon size={16} /> Logout
        </button>
      </div>

      {zoomedImage && (
        <div style={styles.lightboxOverlay} onClick={() => setZoomedImage(null)}>
          <div style={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.lightboxCloseBtn} onClick={() => setZoomedImage(null)} title="Close">
              ✕ Close
            </button>
            <img src={zoomedImage.url} alt={zoomedImage.name} style={styles.lightboxImage} />
            <div style={styles.lightboxCaption}>{zoomedImage.name}</div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: '800px', margin: '0 auto', padding: '24px 16px 60px', textAlign: 'left' },
  topBar: { marginBottom: '20px' },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    textDecoration: 'none',
    color: '#555',
    fontSize: '14px',
    fontWeight: '600'
  },
  banner: {
    padding: '14px 18px',
    borderRadius: '8px',
    border: '1px solid',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    fontWeight: '500'
  },
  bannerTextContainer: { display: 'flex', alignItems: 'center', gap: '10px' },
  bannerCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    flexShrink: 0
  },
  profileCard: {
    display: 'flex', alignItems: 'center', gap: '16px',
    backgroundColor: '#fff', padding: '20px', borderRadius: '10px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '28px'
  },
  avatarCircle: {
    width: '56px', height: '56px', borderRadius: '50%',
    backgroundColor: '#1a1a1a', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '22px', fontWeight: '700', flexShrink: 0
  },
  profileName: { margin: 0, fontSize: '20px', fontWeight: '700', color: '#1a1a1a' },
  profileEmail: { margin: '4px 0 0 0', fontSize: '13px', color: '#777', overflowWrap: 'anywhere' },
  ordersSection: { marginBottom: '20px' },
  sectionHeading: { fontSize: '17px', fontWeight: '700', color: '#1a1a1a', marginBottom: '12px' },
  mutedText: { color: '#888', fontStyle: 'italic', fontSize: '14px' },
  errorBanner: { padding: '12px', backgroundColor: '#fce8e6', color: '#c5221f', borderRadius: '4px', fontSize: '14px' },
  orderList: { display: 'flex', flexDirection: 'column', gap: '12px' },

  orderCard: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    border: '1px solid #eaeaea',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
  },
  orderTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px'
  },
  orderRef: { fontWeight: '700', fontSize: '15px', color: '#1a1a1a' },
  orderDate: { fontSize: '12px', color: '#888', marginTop: '2px' },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 11px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '700',
    whiteSpace: 'nowrap'
  },
  eta: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    marginTop: '12px',
    padding: '10px 12px',
    backgroundColor: '#f6f6f6',
    border: '1px solid #ececec',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#444',
    lineHeight: 1.5
  },
  etaLabel: { color: '#666' },
  etaDates: { color: '#1a1a1a' },
  etaLate: { marginTop: '4px', fontSize: '12px', color: '#7a4a00' },
  etaLink: { color: '#1a1a1a', fontWeight: '600' },
  orderBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginTop: '14px'
  },
  orderTotal: { fontSize: '17px', color: '#1a1a1a' },
  detailsBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 14px',
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
    border: '1px solid #1a1a1a',
    borderRadius: '999px',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, color 0.2s ease'
  },
  orderDetails: {
    marginTop: '16px',
    borderTop: '1px solid #f0f0f0',
    paddingTop: '16px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px'
  },
  detailsBlock: { fontSize: '13px', minWidth: 0 },
  detailsTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    margin: '0 0 10px 0',
    fontSize: '14px',
    color: '#333'
  },
  detailsText: { margin: '0 0 6px 0', color: '#555', overflowWrap: 'anywhere' },
  itemList: { listStyle: 'none', padding: 0, margin: 0 },
  itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px dashed #eee', gap: '10px' },
  itemInfo: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 },
  itemThumb: { width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eaeaea', flexShrink: 0, cursor: 'zoom-in' },
  itemThumbPlaceholder: { width: '32px', height: '32px', borderRadius: '4px', border: '1px solid #eaeaea', backgroundColor: '#f5f5f5', color: '#bbb', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoutSection: { marginTop: '36px', textAlign: 'center' },
  logoutBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '11px 26px',
    backgroundColor: '#fff',
    color: '#c5221f',
    border: '1px solid #c5221f',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, color 0.2s ease'
  },
  lightboxOverlay: {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 3000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'zoom-out', padding: '24px', boxSizing: 'border-box'
  },
  lightboxContent: {
    position: 'relative', maxWidth: '90vw', maxHeight: '90vh',
    display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'default'
  },
  lightboxImage: {
    maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain',
    borderRadius: '6px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)'
  },
  lightboxCaption: { marginTop: '12px', color: '#fff', fontSize: '14px', fontWeight: '600', textAlign: 'center' },
  lightboxCloseBtn: {
    position: 'absolute', top: '-40px', right: '0', background: 'none',
    border: 'none', color: '#fff', fontSize: '18px', fontWeight: '700',
    cursor: 'pointer', padding: '4px 10px'
  }
};

export default AccountPage;