import React, { useState, useEffect, useCallback } from 'react';
import api from './api/api';

function OrdersManager({ backendUrl = 'http://localhost:5000' }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null); // { url, name } | null

  // Fetch orders with signal cancellation for clean component unmounting
  const fetchOrders = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      // 🔄 FIX: correct endpoint is /orders (mounted under /api/orders), not /admin/orders
      const response = await api.get('/orders', { signal });
      const data = response.data;

      // 🔄 FIX: backend returns { success, pagination, data: [...] }
      if (data.success && Array.isArray(data.data)) {
        setOrders(data.data);
      } else if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setError(data.message || data.error || 'Failed to fetch orders.');
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      console.error('Error fetching admin orders:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Network error connecting to backend service.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(controller.signal);
    return () => controller.abort();
  }, [fetchOrders]);

  // Update fulfillment status
  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      // 🔄 FIX: correct endpoint is /orders/:id/status, not /admin/orders/:id/status
      const response = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      const data = response.data;

      if (data.success || response.status === 200) {
        setOrders(prev =>
          prev.map(order =>
            (order.id === orderId || order._id === orderId)
              ? { ...order, status: newStatus }
              : order
          )
        );
      } else {
        alert(data.message || data.error || 'Could not update order status.');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      alert(err.response?.data?.message || err.response?.data?.error || 'Network error updating status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  // Builds a full, browser-loadable URL from the relative image path Prisma returns
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

  // Safe filtering logic
  const filteredOrders = orders.filter(order => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    const orderRef = String(order.paymentReference || order.id || order._id || '').toLowerCase();
    const customerName = String(order.user?.name || order.customerName || '').toLowerCase();
    const customerEmail = String(order.user?.email || order.email || '').toLowerCase();
    const phone = String(order.phone || '').toLowerCase();

    return (
      orderRef.includes(term) ||
      customerName.includes(term) ||
      customerEmail.includes(term) ||
      phone.includes(term)
    );
  });

  if (loading) {
    return <div style={styles.centerContainer}>Loading Customer Orders...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.heading}>Order Fulfillment Dashboard</h2>
          <p style={styles.subHeading}>Review customer purchases and manage delivery status.</p>
        </div>
        <button style={styles.refreshBtn} onClick={() => fetchOrders()}>🔄 Refresh</button>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      {/* Search Input Filter */}
      <div style={styles.filterSection}>
        <div style={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Search by Reference, Customer, Email, or Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button style={styles.clearBtn} onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Reference / ID</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Delivery Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="5" style={styles.emptyTd}>No matching orders found.</td>
              </tr>
            ) : (
              filteredOrders.map((order, idx) => {
                const id = order.id || order._id || `order-${idx}`;
                const isExpanded = expandedOrderId === id;
                // 🔄 FIX: backend field is orderItems, each with a nested variant -> product
                const items = order.orderItems || order.items || [];

                return (
                  <React.Fragment key={id}>
                    <tr style={styles.tr}>
                      <td style={styles.td}>
                        <span style={styles.refCode}>{order.paymentReference || id}</span>
                        <div style={styles.dateText}>
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <strong>{order.user?.name || order.customerName || 'Guest User'}</strong>
                        <div style={styles.subText}>{order.user?.email || order.email || 'N/A'}</div>
                      </td>
                      <td style={styles.td}>
                        <strong>₦{Number(order.totalAmount || order.total || 0).toLocaleString()}</strong>
                      </td>
                      <td style={styles.td}>
                        {/* 🔄 FIX: option values now match schema.prisma's uppercase OrderStatus enum exactly */}
                        <select
                          value={order.status || 'PENDING'}
                          onChange={(e) => handleStatusUpdate(id, e.target.value)}
                          disabled={updatingId === id}
                          style={styles.statusSelect}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.expandBtn}
                          onClick={() => toggleExpand(id)}
                        >
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Order Details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="5" style={styles.detailsTd}>
                          <div style={styles.detailsCard}>
                            <div style={styles.detailsGrid}>
                              <div style={styles.detailsBlock}>
                                <h4 style={styles.detailsTitle}>📍 Delivery Information</h4>
                                <p style={styles.detailsText}>
                                  <strong>Address:</strong> {order.shippingAddress || 'No address provided'}
                                </p>
                                <p style={styles.detailsText}>
                                  <strong>Phone:</strong> {order.phone || 'No phone provided'}
                                </p>
                              </div>

                              <div style={styles.detailsBlock}>
                                <h4 style={styles.detailsTitle}>📦 Purchased Items ({items.length})</h4>
                                <ul style={styles.itemList}>
                                  {items.map((item, itemIdx) => {
                                    // 🔄 FIX: product/size/color live on item.variant.product / item.variant
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
                                        <span>
                                          {item.quantity} x ₦{Number(item.price || 0).toLocaleString()}
                                        </span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Click-to-Zoom Image Lightbox */}
      {zoomedImage && (
        <div style={styles.lightboxOverlay} onClick={() => setZoomedImage(null)}>
          <div style={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button
              style={styles.lightboxCloseBtn}
              onClick={() => setZoomedImage(null)}
              title="Close"
            >
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
  container: { padding: '24px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  heading: { margin: 0, fontSize: '22px', color: '#1a1a1a' },
  subHeading: { margin: '4px 0 0 0', fontSize: '13px', color: '#666' },
  refreshBtn: { padding: '8px 16px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  errorBanner: { padding: '12px', backgroundColor: '#fce8e6', color: '#c5221f', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' },
  filterSection: { marginBottom: '20px' },
  searchWrapper: { position: 'relative', maxWidth: '400px' },
  searchInput: { width: '100%', padding: '10px 32px 10px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  clearBtn: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '12px' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  th: { padding: '12px', borderBottom: '2px solid #eaeaea', color: '#555', fontWeight: '600' },
  tr: { borderBottom: '1px solid #eaeaea' },
  td: { padding: '12px', verticalAlign: 'middle' },
  refCode: { fontFamily: 'monospace', fontWeight: 'bold', color: '#1a1a1a' },
  dateText: { fontSize: '11px', color: '#888', marginTop: '2px' },
  subText: { fontSize: '12px', color: '#777' },
  badge: { display: 'inline-block', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' },
  statusSelect: { padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px', outline: 'none' },
  expandBtn: { padding: '6px 12px', backgroundColor: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  emptyTd: { textAlign: 'center', padding: '30px', color: '#888', fontStyle: 'italic' },
  detailsTd: { backgroundColor: '#fafafa', padding: '16px', borderBottom: '1px solid #eaeaea' },
  detailsCard: { padding: '16px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e5e5e5' },
  detailsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
  detailsBlock: { fontSize: '13px' },
  detailsTitle: { margin: '0 0 10px 0', fontSize: '14px', color: '#333' },
  detailsText: { margin: '0 0 6px 0', color: '#555' },
  itemList: { listStyle: 'none', padding: 0, margin: 0 },
  itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px dashed #eee', gap: '10px' },
  itemInfo: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 },
  itemThumb: { width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eaeaea', flexShrink: 0, cursor: 'zoom-in' },
  itemThumbPlaceholder: { width: '32px', height: '32px', borderRadius: '4px', border: '1px solid #eaeaea', backgroundColor: '#f5f5f5', color: '#bbb', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  centerContainer: { textAlign: 'center', padding: '40px', color: '#666', fontSize: '16px' },
  lightboxOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 3000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'zoom-out',
    padding: '24px',
    boxSizing: 'border-box'
  },
  lightboxContent: {
    position: 'relative',
    maxWidth: '90vw',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'default'
  },
  lightboxImage: {
    maxWidth: '90vw',
    maxHeight: '80vh',
    objectFit: 'contain',
    borderRadius: '6px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.4)'
  },
  lightboxCaption: {
    marginTop: '12px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'center'
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: '-40px',
    right: '0',
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    padding: '4px 10px'
  }
};

export default OrdersManager;