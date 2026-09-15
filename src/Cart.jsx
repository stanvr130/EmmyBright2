import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api/api';

function Cart({ isOpen, onClose, cartItems = [], onUpdateQuantity, onRemoveItem, backendUrl, user }) {
  if (!isOpen) return null;

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [deliveryData, setDeliveryData] = useState({
    streetAddress: '',
    city: '',
    state: '',
    phone: ''
  });

  const DELIVERY_FEE = 3000;
  const itemsSubtotal = cartItems.reduce((total, item) => total + (Number(item.price) * item.quantity), 0);
  const grandTotal = itemsSubtotal + (cartItems.length > 0 ? DELIVERY_FEE : 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeliveryData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    // Login is required before delivery details. Show custom confirmation modal
    // instead of redirecting immediately, so the guest isn't yanked away
    // without warning.
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!deliveryData.streetAddress || !deliveryData.city || !deliveryData.state || !deliveryData.phone) {
      alert('Please fill in all shipping and phone contact fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/orders', {
        items: cartItems.map(item => ({
          variantId: item.variantId || (item.variants && item.variants[0]?.id) || item.id || item._id,
          quantity: item.quantity
        })),
        shippingAddress: `${deliveryData.streetAddress}, ${deliveryData.city}, ${deliveryData.state}`,
        phone: deliveryData.phone
      });

      const data = response.data;

      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        alert(data.error || data.message || 'Failed to initialize payment gateway.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Network error initializing payment gateway connection.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmLogin = () => {
    setShowLoginModal(false);
    sessionStorage.setItem('eb_pendingCheckout', 'true');
    onClose();
    navigate('/login');
  };

  const handleCancelLogin = () => {
    setShowLoginModal(false);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <style>{responsiveCSS}</style>
      <div className="proportional-cart-panel" style={styles.cartPanel} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTitleGroup}>
            <h2 style={styles.title}>Your Cart</h2>
            <span style={styles.badge}>{cartItems.length}</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close Cart" type="button">✕</button>
        </div>

        {/* Main Form Container */}
        <form onSubmit={handleCheckout} style={styles.formWrapper}>
          <div style={styles.itemsContainer}>
            {cartItems.length === 0 ? (
              <div style={styles.emptyContainer}>
                <div style={styles.emptyIcon}>🛍️</div>
                <p style={styles.emptyText}>Your cart is empty</p>
              </div>
            ) : (
              <>
                {cartItems.map((item, index) => {
                  const cartItemUniqueKey = item.variantId || item.id || item._id || `cart-item-${index}`;

                let imagePath = item.image || '';
let fullImageUrl = null;
if (imagePath) {
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    fullImageUrl = imagePath;
  } else {
    if (imagePath.startsWith('/public-images')) {
      imagePath = imagePath.replace('/public-images', '');
    }
    fullImageUrl = `${backendUrl}/public-images${imagePath}`;
  }
}
                  return (
                    <div key={cartItemUniqueKey} style={styles.cartItem}>
                      <img 
                        src={fullImageUrl || 'https://via.placeholder.com/60'} 
                        alt={item.name} 
                        style={styles.itemImage}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/60?text=Item'; }}
                      />
                      
                      <div style={styles.itemDetails}>
                        <h4 style={styles.itemName}>{item.name}</h4>
                        {item.size && <p style={styles.itemMeta}>Size: {item.size}</p>}
                        <p style={styles.itemPrice}>₦{Number(item.price).toLocaleString()}</p>
                        
                        <div style={styles.quantityRow}>
                          <button 
                            type="button"
                            style={styles.qtyBtn} 
                            onClick={() => onUpdateQuantity(cartItemUniqueKey, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span style={styles.qtyText}>{item.quantity}</span>
                          <button 
                            type="button"
                            style={styles.qtyBtn} 
                            onClick={() => onUpdateQuantity(cartItemUniqueKey, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button 
                        type="button"
                        style={styles.removeBtn} 
                        onClick={() => onRemoveItem(cartItemUniqueKey)}
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}

                {/* Delivery details are only ever shown to a logged-in user —
                    a guest is sent to /login first, and only sees this form
                    once they're back with an active session. */}
                {user ? (
                  <div style={styles.deliverySection}>
                    <h3 style={styles.sectionHeader}>Shipping Details</h3>
                    <div style={styles.formGroup}>
                      <input
                        type="text"
                        name="streetAddress"
                        placeholder="Street Address"
                        value={deliveryData.streetAddress}
                        onChange={handleInputChange}
                        style={styles.inputField}
                        required
                      />
                      <div style={styles.inlineFormGroup}>
                        <input
                          type="text"
                          name="city"
                          placeholder="City"
                          value={deliveryData.city}
                          onChange={handleInputChange}
                          style={{ ...styles.inputField, flex: 1, minWidth: 0 }}
                          required
                        />
                        <input
                          type="text"
                          name="state"
                          placeholder="State"
                          value={deliveryData.state}
                          onChange={handleInputChange}
                          style={{ ...styles.inputField, flex: 1, minWidth: 0 }}
                          required
                        />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number"
                        value={deliveryData.phone}
                        onChange={handleInputChange}
                        style={styles.inputField}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div style={styles.deliverySection}>
                    <p style={styles.guestPrompt}>
                      Log in to enter your delivery details and complete checkout.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Controls */}
          {cartItems.length > 0 && (
            <div style={styles.footer}>
              <div style={styles.breakdownRow}>
                <span>Subtotal</span>
                <span>₦{itemsSubtotal.toLocaleString()}</span>
              </div>
              <div style={styles.breakdownRow}>
                <span>Delivery</span>
                <span>₦{DELIVERY_FEE.toLocaleString()}</span>
              </div>
              <hr style={styles.divider} />
              <div style={styles.totalRow}>
                <span>Total</span>
                <span style={styles.totalAmount}>₦{grandTotal.toLocaleString()}</span>
              </div>

              <button 
                type="submit"
                style={{
                  ...styles.checkoutBtn,
                  backgroundColor: loading ? '#666666' : '#000000',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }} 
                disabled={loading}
              >
                {loading ? 'Processing...' : user ? `Pay ₦${grandTotal.toLocaleString()}` : 'Log In to Checkout'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Custom Login Prompt Modal */}
      {showLoginModal && (
        <div style={modalStyles.overlay} onClick={(e) => e.stopPropagation()}>
          <div style={modalStyles.container}>
            <h3 style={modalStyles.title}>Login Required</h3>
            <p style={modalStyles.text}>
              You need to log in to complete checkout. Would you like to continue to login?
            </p>
            <div style={modalStyles.buttonRow}>
              <button 
                type="button" 
                style={modalStyles.cancelBtn} 
                onClick={handleCancelLogin}
              >
                Cancel
              </button>
              <button 
                type="button" 
                style={modalStyles.confirmBtn} 
                onClick={handleConfirmLogin}
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000
  },
  container: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    maxWidth: '380px',
    width: '90%',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
    textAlign: 'center'
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#111111'
  },
  text: {
    margin: '0 0 20px 0',
    fontSize: '14px',
    color: '#555555',
    lineHeight: '1.5'
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px'
  },
  cancelBtn: {
    flex: 1,
    padding: '10px 16px',
    border: '1px solid #dddddd',
    borderRadius: '6px',
    backgroundColor: '#f5f5f7',
    color: '#333333',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600'
  },
  confirmBtn: {
    flex: 1,
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#000000',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '700'
  }
};

const responsiveCSS = `
  .proportional-cart-panel * {
    box-sizing: border-box;
  }
  
  @media (min-width: 1024px) {
    .proportional-cart-panel {
      width: 35vw !important;
      height: 80vh !important;
    }
  }

  @media (max-width: 480px) {
    .proportional-cart-panel {
      width: 100vw !important;
      height: 100vh !important;
      border-radius: 0 !important;
    }
    .proportional-cart-panel input {
      font-size: 11px !important;
      padding: 6px 8px !important;
    }
  }
`;

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    backdropFilter: 'blur(2px)',
    zIndex: 2000,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-start'
  },
  cartPanel: {
    position: 'fixed',
    top: '0px',
    right: '0px',
    width: '40vw',
    height: '70vh',
    backgroundColor: '#ffffff',
    boxShadow: '-4px 4px 20px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderBottomLeftRadius: '12px'
  },
  formWrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100% - 50px)',
    flexGrow: 1,
    overflow: 'hidden',
    minHeight: 0
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    flexShrink: 0,
    height: '50px'
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  title: {
    margin: 0,
    fontSize: 'clamp(14px, 1.2vw, 18px)',
    fontWeight: '700',
    color: '#111111'
  },
  badge: {
    backgroundColor: '#f0f0f0',
    color: '#555555',
    fontSize: 'clamp(10px, 0.9vw, 12px)',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '10px'
  },
  closeBtn: {
    background: '#f5f5f7',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#555',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemsContainer: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '16px',
    backgroundColor: '#fafafa',
      minHeight: 0,
  WebkitOverflowScrolling: 'touch'
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center'
  },
  emptyIcon: {
    fontSize: '36px'
  },
  emptyText: {
    fontSize: '14px',
    color: '#666666',
    margin: '4px 0 0 0'
  },
  cartItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    marginBottom: '8px',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    border: '1px solid #eeeeee'
  },
  itemImage: {
    width: '48px',
    height: '48px',
    objectFit: 'cover',
    borderRadius: '4px',
    marginRight: '10px',
    flexShrink: 0
  },
  itemDetails: {
    flexGrow: 1,
    minWidth: 0
  },
  itemName: {
    margin: '0 0 2px 0',
    fontSize: '13px',
    fontWeight: '600',
    color: '#111111',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  itemMeta: {
    margin: '0 0 2px 0',
    fontSize: '11px',
    color: '#777777'
  },
  itemPrice: {
    margin: '0 0 4px 0',
    fontSize: '12px',
    fontWeight: '700',
    color: '#000000'
  },
  quantityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  qtyBtn: {
    width: '20px',
    height: '20px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700'
  },
  qtyText: {
    fontSize: '12px',
    fontWeight: '600'
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '15px',
    marginLeft: '6px',
    padding: '2px'
  },
  deliverySection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e2e2'
  },
  sectionHeader: {
    margin: '0 0 10px 0',
    fontSize: '12px',
    fontWeight: '700',
    color: '#222222',
    textTransform: 'uppercase'
  },
  guestPrompt: {
    margin: 0,
    fontSize: '13px',
    color: '#666666',
    lineHeight: '1.5',
    textAlign: 'center',
    padding: '8px 4px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  inlineFormGroup: {
    display: 'flex',
    gap: '8px'
  },
  inputField: {
    padding: '8px 10px',
    border: '1px solid #dddddd',
    borderRadius: '4px',
    fontSize: '12px',
    outline: 'none',
    width: '100%',
    backgroundColor: '#ffffff'
  },
  footer: {
    padding: '16px',
    borderTop: '1px solid #f0f0f0',
    backgroundColor: '#ffffff',
    flexShrink: 0
  },
  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#666666',
    marginBottom: '4px'
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #eeeeee',
    margin: '8px 0'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#111111'
  },
  totalAmount: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#000000'
  },
  checkoutBtn: {
    width: '100%',
    color: '#ffffff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '700'
  }
};

export default Cart;