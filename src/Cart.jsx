import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api/api';

// Same font stack the product cards use (e.g. the "Checkers Blue 3pcs" name)
const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

function Cart({ isOpen, onClose, cartItems = [], onUpdateQuantity, onRemoveItem, backendUrl, user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deliveryData, setDeliveryData] = useState({
    streetAddress: '',
    city: '',
    state: '',
    phone: ''
  });

  // Hooks above must always run, so the "closed" early return lives below them
  if (!isOpen) return null;

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

    // 1. Authentication check
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    // 2. Strict delivery data validation (with whitespace trimming)
    const trimmedAddress = deliveryData.streetAddress?.trim();
    const trimmedCity = deliveryData.city?.trim();
    const trimmedState = deliveryData.state?.trim();
    const trimmedPhone = deliveryData.phone?.trim();

    if (!trimmedAddress || !trimmedCity || !trimmedState || !trimmedPhone) {
      setShowValidationModal(true);
      return; // early exit so empty payloads never reach Paystack/API
    }

    setLoading(true);

    try {
      const response = await api.post('/orders', {
        items: cartItems.map(item => ({
          variantId: item.variantId || (item.variants && item.variants[0]?.id) || item.id || item._id,
          quantity: item.quantity
        })),
        shippingAddress: `${trimmedAddress}, ${trimmedCity}, ${trimmedState}`,
        phone: trimmedPhone
      });

      const data = response.data;

      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setErrorMessage(data.error || data.message || 'Failed to initialize payment gateway.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setErrorMessage(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Network error initializing payment gateway connection.'
      );
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
    <div className="cart-overlay" style={styles.overlay} onClick={onClose}>
      <style>{responsiveCSS}</style>
      <div className="proportional-cart-panel" style={styles.cartPanel} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTitleGroup}>
            <h2 style={styles.title}>Your Cart</h2>
            <span style={styles.badge}>{cartItems.length}</span>
          </div>
          <button className="cart-btn" style={styles.closeBtn} onClick={onClose} aria-label="Close Cart" type="button">✕</button>
        </div>

        {/* Main Form Container */}
        <form onSubmit={handleCheckout} style={styles.formWrapper} noValidate>
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
                            className="cart-btn"
                            style={styles.qtyBtn}
                            aria-label="Decrease quantity"
                            onClick={() => onUpdateQuantity(cartItemUniqueKey, item.quantity - 1)}
                          >
                            −
                          </button>
                          <span style={styles.qtyText}>{item.quantity}</span>
                          <button
                            type="button"
                            className="cart-btn"
                            style={styles.qtyBtn}
                            aria-label="Increase quantity"
                            onClick={() => onUpdateQuantity(cartItemUniqueKey, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="cart-btn"
                        style={styles.removeBtn}
                        onClick={() => onRemoveItem(cartItemUniqueKey)}
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}

                {user ? (
                  <div style={styles.deliverySection}>
                    <h3 style={styles.sectionHeader}>Shipping Details</h3>
                    <div style={styles.formGroup}>
                      <input
                        className="cart-input"
                        type="text"
                        name="streetAddress"
                        placeholder="Street Address"
                        autoComplete="street-address"
                        value={deliveryData.streetAddress}
                        onChange={handleInputChange}
                        style={styles.inputField}
                      />
                      <div style={styles.inlineFormGroup}>
                        <input
                          className="cart-input"
                          type="text"
                          name="city"
                          placeholder="City"
                          autoComplete="address-level2"
                          value={deliveryData.city}
                          onChange={handleInputChange}
                          style={{ ...styles.inputField, flex: 1, minWidth: 0 }}
                        />
                        <input
                          className="cart-input"
                          type="text"
                          name="state"
                          placeholder="State"
                          autoComplete="address-level1"
                          value={deliveryData.state}
                          onChange={handleInputChange}
                          style={{ ...styles.inputField, flex: 1, minWidth: 0 }}
                        />
                      </div>
                      <input
                        className="cart-input"
                        type="tel"
                        name="phone"
                        placeholder="Phone Number"
                        autoComplete="tel"
                        value={deliveryData.phone}
                        onChange={handleInputChange}
                        style={styles.inputField}
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

          {/* Payment toggle + summary panel */}
          {cartItems.length > 0 && (
            <>
              {!showPaymentSummary && (
                <button
                  type="button"
                  className="cart-btn"
                  style={styles.paymentToggleBtn}
                  onClick={() => setShowPaymentSummary(true)}
                >
                  Payment — ₦{grandTotal.toLocaleString()}
                </button>
              )}

              {showPaymentSummary && (
                <div style={styles.paymentSummaryPanel}>
                  <button
                    type="button"
                    className="cart-btn"
                    style={styles.summaryCloseBtn}
                    onClick={() => setShowPaymentSummary(false)}
                    aria-label="Close payment summary"
                  >
                    ✕
                  </button>

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
                    className="cart-btn"
                    style={{
                      ...styles.checkoutBtn,
                      backgroundColor: loading ? '#5a5a5a' : '#1a1a1a',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : user ? `Pay ₦${grandTotal.toLocaleString()}` : 'Log In to Checkout'}
                  </button>
                </div>
              )}
            </>
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
                className="cart-btn"
                style={modalStyles.cancelBtn}
                onClick={handleCancelLogin}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cart-btn"
                style={modalStyles.confirmBtn}
                onClick={handleConfirmLogin}
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Warning Modal */}
      {showValidationModal && (
        <div style={modalStyles.overlay} onClick={(e) => e.stopPropagation()}>
          <div style={modalStyles.container}>
            <h3 style={modalStyles.title}>Incomplete Information</h3>
            <p style={modalStyles.text}>
              Please fill in all shipping and phone contact fields.
            </p>
            <div style={modalStyles.buttonRow}>
              <button
                type="button"
                className="cart-btn"
                style={modalStyles.confirmBtn}
                onClick={() => setShowValidationModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment / Server Error Modal (replaces the plain browser alert) */}
      {errorMessage && (
        <div style={modalStyles.overlay} onClick={(e) => e.stopPropagation()}>
          <div style={modalStyles.container}>
            <h3 style={modalStyles.title}>Something Went Wrong</h3>
            <p style={modalStyles.text}>{errorMessage}</p>
            <div style={modalStyles.buttonRow}>
              <button
                type="button"
                className="cart-btn"
                style={modalStyles.confirmBtn}
                onClick={() => setErrorMessage('')}
              >
                OK
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
    border: '1px solid #dddddd',
    outline: '1px solid #eeeeee',
    outlineOffset: '-6px',
    padding: '28px 24px',
    borderRadius: '4px',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
    color: '#1a1a1a',
    fontFamily: FONT_FAMILY
  },
  title: {
    margin: '0 0 12px 0',
    fontFamily: FONT_FAMILY,
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a1a1a'
  },
  text: {
    margin: '0 0 22px 0',
    fontSize: '14px',
    color: '#444444',
    lineHeight: '1.6'
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px'
  },
  cancelBtn: {
    flex: 1,
    padding: '11px 16px',
    border: '1px solid #1a1a1a',
    borderRadius: '2px',
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
    cursor: 'pointer',
    fontFamily: FONT_FAMILY,
    fontSize: '13px',
    fontWeight: '700'
  },
  confirmBtn: {
    flex: 1,
    padding: '11px 16px',
    border: '1px solid #1a1a1a',
    borderRadius: '2px',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    cursor: 'pointer',
    fontFamily: FONT_FAMILY,
    fontSize: '13px',
    fontWeight: '700'
  }
};

// Rules that inline styles can't express (placeholders, focus, autofill,
// iOS/Safari text colour quirks) plus the responsive sizing.
const responsiveCSS = `
  .cart-overlay,
  .cart-overlay * {
    box-sizing: border-box;
    color-scheme: light;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }

  /* Buttons: never inherit a dark-mode / system colour */
  .cart-btn {
    -webkit-appearance: none;
    appearance: none;
    font-family: inherit;
    -webkit-tap-highlight-color: transparent;
  }
  .cart-btn:focus-visible {
    outline: 2px solid #1a1a1a;
    outline-offset: 2px;
  }
  .cart-btn:disabled {
    opacity: 0.85;
  }

  /* Inputs: force readable text on every browser */
  .cart-input {
    -webkit-appearance: none;
    appearance: none;
    font-family: ${FONT_FAMILY};
    color: #1a1a1a;
    -webkit-text-fill-color: #1a1a1a;
    background-color: #ffffff;
    opacity: 1;
  }
  .cart-input::placeholder {
    color: #707070;
    -webkit-text-fill-color: #707070;
    opacity: 1;
  }
  .cart-input:focus {
    border-color: #1a1a1a !important;
    box-shadow: 0 0 0 1px #1a1a1a;
  }
  /* Chrome / Safari autofill would otherwise turn the text pale */
  .cart-input:-webkit-autofill,
  .cart-input:-webkit-autofill:focus {
    -webkit-text-fill-color: #1a1a1a;
    -webkit-box-shadow: 0 0 0 1000px #ffffff inset;
    box-shadow: 0 0 0 1000px #ffffff inset;
  }

  .proportional-cart-panel {
    font-family: ${FONT_FAMILY};
    color: #1a1a1a;
  }

  @media (min-width: 1024px) {
    .proportional-cart-panel {
      width: 35vw !important;
      height: 80vh !important;
      min-width: 420px;
    }
  }

  @media (max-width: 480px) {
    .proportional-cart-panel {
      width: 100vw !important;
      height: 100vh !important;
      border-radius: 0 !important;
    }
    /* 16px stops iOS from zooming the page when a field is focused */
    .cart-input {
      font-size: 16px !important;
      padding: 10px 12px !important;
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    color: '#1a1a1a',
    fontFamily: FONT_FAMILY,
    borderLeft: '1px solid #dddddd',
    boxShadow: '-6px 6px 28px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderBottomLeftRadius: '4px'
  },
  formWrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100% - 56px)',
    flexGrow: 1,
    overflow: 'hidden',
    minHeight: 0
  },
  header: {
    padding: '12px 18px',
    borderBottom: '3px double #dddddd',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    flexShrink: 0,
    height: '56px'
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  title: {
    margin: 0,
    fontFamily: FONT_FAMILY,
    fontSize: 'clamp(16px, 1.4vw, 20px)',
    fontWeight: '700',
    letterSpacing: '0.3px',
    color: '#1a1a1a'
  },
  badge: {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '700',
    padding: '2px 9px',
    borderRadius: '999px',
    lineHeight: '1.5'
  },
  closeBtn: {
    background: '#f5f5f7',
    border: '1px solid #1a1a1a',
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    color: '#1a1a1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0
  },
  itemsContainer: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '16px 18px',
    paddingBottom: '130px',
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
    fontSize: '40px'
  },
  emptyText: {
    fontFamily: FONT_FAMILY,
    fontSize: '15px',
    color: '#444444',
    margin: '8px 0 0 0'
  },
  cartItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    marginBottom: '10px',
    backgroundColor: '#ffffff',
    borderRadius: '2px',
    border: '1px solid #e2e2e2'
  },
  itemImage: {
    width: '56px',
    height: '56px',
    objectFit: 'cover',
    borderRadius: '2px',
    border: '1px solid #eeeeee',
    marginRight: '12px',
    flexShrink: 0
  },
  itemDetails: {
    flexGrow: 1,
    minWidth: 0
  },
  itemName: {
    margin: '0 0 3px 0',
    fontFamily: FONT_FAMILY,
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  itemMeta: {
    margin: '0 0 3px 0',
    fontSize: '12px',
    color: '#555555'
  },
  itemPrice: {
    margin: '0 0 6px 0',
    fontSize: '13px',
    fontWeight: '700',
    color: '#1a1a1a'
  },
  quantityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  qtyBtn: {
    width: '26px',
    height: '26px',
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
    border: '1px solid #1a1a1a',
    borderRadius: '2px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '700',
    lineHeight: 1,
    padding: 0
  },
  qtyText: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1a1a1a',
    minWidth: '18px',
    textAlign: 'center'
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#1a1a1a',
    cursor: 'pointer',
    fontSize: '17px',
    marginLeft: '8px',
    padding: '4px'
  },
  deliverySection: {
    marginTop: '18px',
    paddingTop: '18px',
    borderTop: '1px solid #dddddd'
  },
  sectionHeader: {
    margin: '0 0 12px 0',
    fontFamily: FONT_FAMILY,
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '1.5px',
    color: '#1a1a1a',
    textTransform: 'uppercase',
    textAlign: 'center'
  },
  guestPrompt: {
    margin: 0,
    fontSize: '14px',
    color: '#444444',
    lineHeight: '1.6',
    textAlign: 'center',
    padding: '8px 4px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  inlineFormGroup: {
    display: 'flex',
    gap: '10px'
  },
  inputField: {
    padding: '10px 12px',
    border: '1px solid #bdbdbd',
    borderRadius: '2px',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    backgroundColor: '#ffffff',
    color: '#1a1a1a'
  },
  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#444444',
    marginBottom: '6px'
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #dddddd',
    margin: '10px 0'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: FONT_FAMILY,
    fontSize: '15px',
    fontWeight: '700',
    marginBottom: '14px',
    color: '#1a1a1a'
  },
  totalAmount: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#1a1a1a'
  },
  checkoutBtn: {
    width: '100%',
    color: '#ffffff',
    border: '1px solid #1a1a1a',
    padding: '12px 16px',
    borderRadius: '2px',
    fontFamily: FONT_FAMILY,
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '0.5px'
  },
  paymentToggleBtn: {
    position: 'fixed',
    top: '70vh',
    right: '20px',
    padding: '12px 22px',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    border: '1px solid #1a1a1a',
    borderRadius: '2px',
    fontFamily: FONT_FAMILY,
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    zIndex: 15,
    boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
  },
  paymentSummaryPanel: {
    position: 'fixed',
    top: '70vh',
    right: '20px',
    width: '330px',
    maxWidth: 'calc(100vw - 40px)',
    padding: '20px 18px 18px',
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
    fontFamily: FONT_FAMILY,
    border: '1px solid #dddddd',
    outline: '1px solid #eeeeee',
    outlineOffset: '-5px',
    borderRadius: '2px',
    boxShadow: '0 8px 28px rgba(0,0,0,0.3)',
    zIndex: 15
  },
  summaryCloseBtn: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: '#f5f5f7',
    border: '1px solid #1a1a1a',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    color: '#1a1a1a',
    padding: 0
  }
};

export default Cart;