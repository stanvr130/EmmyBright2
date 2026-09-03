import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from './api/api';

const STATUS_COLORS = {
  PENDING:    { bg: '#fff4e5', color: '#b36b00' },
  PROCESSING: { bg: '#e8f0fe', color: '#1a56db' },
  SHIPPED:    { bg: '#e6f4ea', color: '#137333' },
  DELIVERED:  { bg: '#e6f4ea', color: '#137333' },
  CANCELLED:  { bg: '#fce8e6', color: '#c5221f' }
};

const formatStatusLabel = (status) => {
  if (!status) return 'Pending';
  return status.charAt(0) + status.slice(1).toLowerCase();
};

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
  }, [fetchOrders, searchParams]); // Safely omitted clearCart via ref guard pattern

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
    const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;
    const isPaid = order.paymentStatus === 'PAID';

    const itemsSubtotal = Number(order.totalAmount || 0);
    const deliveryFee = Number(order.deliveryFee) || 3000;
    const grandTotal = itemsSubtotal + deliveryFee;

    return (
      <div key={order.id} style={styles.orderCard}>
        <div style={styles.orderCardHeader} onClick={() => toggleExpand(order.id)}>
          <div>
            <span style={styles.orderRef}>Order #{order.id}</span>
            <div style={styles.orderDate}>
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
            </div>
          </div>

          <div style={styles.orderHeaderRight}>
            <span style={{ ...styles.badge, backgroundColor: statusStyle.bg, color: statusStyle.color }}>
              {formatStatusLabel(order.status)}
            </span>
            <span style={{
              ...styles.badge,
              backgroundColor: isPaid ? '#e6f4ea' : '#fce8e6',
              color: isPaid ? '#137333' : '#c5221f'
            }}>
              {isPaid ? 'PAID' : 'UNPAID'}
            </span>
            <strong style={styles.orderTotal}>₦{grandTotal.toLocaleString()}</strong>
            <span style={styles.expandArrow}>{isExpanded ? '▲' : '▼'}</span>
          </div>
        </div>

        {isExpanded && (
          <div style={styles.orderDetails}>
            <div style={styles.detailsBlock}>
              <h4 style={styles.detailsTitle}>📍 Delivery Details</h4>
              <p style={styles.detailsText}><strong>Address:</strong> {order.shippingAddress || 'No address provided'}</p>
              <p style={styles.detailsText}><strong>Phone:</strong> {order.phone || 'No phone provided'}</p>
              
              <h4 style={{ ...styles.detailsTitle, marginTop: '16px' }}>💳 Payment Summary</h4>
              <p style={styles.detailsText}><strong>Items Subtotal:</strong> ₦{itemsSubtotal.toLocaleString()}</p>
              <p style={styles.detailsText}><strong>Delivery Fee:</strong> ₦{deliveryFee.toLocaleString()}</p>
              <p style={{ ...styles.detailsText, fontSize: '14px', fontWeight: '700', color: '#1a1a1a', marginTop: '4px' }}>
                <strong>Grand Total Paid:</strong> ₦{grandTotal.toLocaleString()}
              </p>
            </div>

            <div style={styles.detailsBlock}>
              <h4 style={styles.detailsTitle}>📦 Items Purchased ({items.length})</h4>
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
      <div style={styles.topBar}>
        <Link to="/" style={styles.backLink}>← Back to Shop</Link>
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
              <span style={{ animation: 'spin 1s linear infinite' }}>🔄</span>
            ) : verificationFeedback.success ? (
              '✅'
            ) : (
              '⚠️'
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
        <div>
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
        <button style={styles.logoutBtn} onClick={onLogout}>
          🚪 Logout
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
  page: { maxWidth: '800px', margin: '0 auto', padding: '24px 16px 60px' },
  topBar: { marginBottom: '20px' },
  backLink: { textDecoration: 'none', color: '#555', fontSize: '14px', fontWeight: '600' },
  banner: {
    padding: '14px 18px',
    borderRadius: '8px',
    border: '1px solid',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontWeight: '600'
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
  profileEmail: { margin: '4px 0 0 0', fontSize: '13px', color: '#777' },
  ordersSection: { marginBottom: '20px' },
  sectionHeading: { fontSize: '17px', fontWeight: '700', color: '#1a1a1a', marginBottom: '12px' },
  mutedText: { color: '#888', fontStyle: 'italic', fontSize: '14px' },
  errorBanner: { padding: '12px', backgroundColor: '#fce8e6', color: '#c5221f', borderRadius: '4px', fontSize: '14px' },
  orderList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  orderCard: { backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eaeaea', overflow: 'hidden' },
  orderCardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', cursor: 'pointer', flexWrap: 'wrap', gap: '10px'
  },
  orderRef: { fontWeight: '700', fontSize: '14px', color: '#1a1a1a' },
  orderDate: { fontSize: '11px', color: '#888', marginTop: '2px' },
  orderHeaderRight: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  badge: { padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' },
  orderTotal: { fontSize: '14px', color: '#1a1a1a' },
  expandArrow: { fontSize: '11px', color: '#999' },
  orderDetails: {
    borderTop: '1px solid #f0f0f0', padding: '16px',
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px',
    backgroundColor: '#fafafa'
  },
  detailsBlock: { fontSize: '13px' },
  detailsTitle: { margin: '0 0 10px 0', fontSize: '14px', color: '#333' },
  detailsText: { margin: '0 0 6px 0', color: '#555' },
  itemList: { listStyle: 'none', padding: 0, margin: 0 },
  itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px dashed #eee', gap: '10px' },
  itemInfo: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 },
  itemThumb: { width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eaeaea', flexShrink: 0, cursor: 'zoom-in' },
  itemThumbPlaceholder: { width: '32px', height: '32px', borderRadius: '4px', border: '1px solid #eaeaea', backgroundColor: '#f5f5f5', color: '#bbb', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoutSection: { marginTop: '36px', textAlign: 'center' },
  logoutBtn: {
    padding: '12px 28px', backgroundColor: '#fff', color: '#c5221f',
    border: '1px solid #c5221f', borderRadius: '6px', fontSize: '14px',
    fontWeight: '700', cursor: 'pointer'
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