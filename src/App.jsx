import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import Cart from './Cart'; 
import Auth from './Auth'; 
import AdminPanel from './AdminPanel';
import AccountPage from './AccountPage';
import ProtectedRoute from './ProtectedRoute';
import ProductDetail from './ProductDetail';
import api from './api/api'; 
import './App.css';

const styles = {
  singleViewContainer: {},
  backBtn: {},
  detailsFlexLayout: {},
  singleImageColumn: {},
  singleLargeImage: {},
  singleNoImage: {},
  singleInfoColumn: {},
  luxuryCategoryTag: {},
  singleProductName: {},
  singlePriceTag: {},
  dividerLine: {},
  sectionSubHeading: {},
  singleDescriptionText: {},
  singleActionRow: {},
  singleAddToCartBtn: {},
  inlineQtyRow: {},
  inlineQtyBtn: {},
  inlineQtyText: {},
  deliveryContainer: {},
  integratedDeliveryWrapper: {}
};

function App() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(''); 
  
  // PRODUCT DETAIL VIEW STATE
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  // USER / AUTHENTICATION STATES
  const [user, setUser] = useState(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  
  // SIDEBAR NAVIGATION STATE
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // GLOBAL CART STATES
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('eb_cartItems');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // DELIVERY TRACKER STATE
  const [deliveryData, setDeliveryData] = useState(() => {
    const savedDelivery = localStorage.getItem('eb_deliveryData');
    return savedDelivery ? JSON.parse(savedDelivery) : {
      type: 'standard',
      fee: 3000,
      addressDetails: {},
      isValid: false
    };
  });
  
  const backendUrl = 'http://localhost:5000'; 
  const navigate = useNavigate();
  const location = useLocation();

  const syncCartToBackend = async (currentCart) => {
    if (!localStorage.getItem('authToken')) return;
    try {
      await api.post('/cart', { cartItems: currentCart });
    } catch (err) {
      console.error('Failed to sync cart records to database:', err);
    }
  };

  const syncDeliveryToBackend = async (currentDelivery) => {
    if (!localStorage.getItem('authToken')) return;
    try {
      await api.post('/delivery', { deliveryData: currentDelivery });
    } catch (err) {
      console.error('Failed to sync delivery details to database:', err);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('userData');
    const token = localStorage.getItem('authToken');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        setUser({ name: savedUser });
      }
    }
    setCheckedAuth(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('eb_cartItems', JSON.stringify(cartItems));
    syncCartToBackend(cartItems);
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('eb_deliveryData', JSON.stringify(deliveryData));
    syncDeliveryToBackend(deliveryData);
  }, [deliveryData]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      const items = Array.isArray(response.data) ? response.data : response.data.products || [];
      setProducts(items);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch products from backend');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAuthSuccess = async (authenticatedUser) => {
    setUser(authenticatedUser);
    
    try {
      const cartResponse = await api.get('/cart');
      if (cartResponse.data && cartResponse.data.cartItems) {
        setCartItems(cartResponse.data.cartItems);
        localStorage.setItem('eb_cartItems', JSON.stringify(cartResponse.data.cartItems));
      }

      const deliveryResponse = await api.get('/delivery');
      if (deliveryResponse.data && deliveryResponse.data.deliveryData) {
        setDeliveryData(deliveryResponse.data.deliveryData);
        localStorage.setItem('eb_deliveryData', JSON.stringify(deliveryResponse.data.deliveryData));
      }
    } catch (err) {
      console.error("Error restoring remote database variables context on authorization sync:", err);
    }
  };

  const handleCloseProductView = () => {
    setSelectedProduct(null);
    setSelectedSize(null);
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error on server:', err);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('eb_cartItems');
      localStorage.removeItem('eb_deliveryData');
      
      setUser(null);
      setCartItems([]);
      setDeliveryData({
        type: 'standard',
        fee: 3000,
        addressDetails: {},
        isValid: false
      });
      setSelectedProduct(null);
      setSelectedSize(null);
      navigate('/');
    }
  };

  const handleAddToCart = (product, chosenVariant) => {
    setCartItems((prevItems) => {
      const targetVariantId = chosenVariant ? chosenVariant.id : (product.variantId || product.id || product._id);
      const existingItem = prevItems.find(item => (item.variantId || item.id || item._id) === targetVariantId);
      
      if (existingItem) {
        return prevItems.map(item => 
          (item.variantId || item.id || item._id) === targetVariantId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [
        ...prevItems, 
        { 
          ...product, 
          id: product.id || product._id,
          variantId: targetVariantId,
          name: chosenVariant && chosenVariant.size !== 'Standard' 
            ? `${product.name} (${chosenVariant.size})` 
            : product.name,
          quantity: 1 
        }
      ];
    });
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map(item => (item.variantId || item.id || item._id) === productId ? { ...item, quantity: newQuantity } : item)
    );
  };

  const handleRemoveItem = (productId) => {
    setCartItems((prevItems) => prevItems.filter(item => (item.variantId || item.id || item._id) !== productId));
  };

  if (!checkedAuth) {
    return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>Loading EmmyBright...</div>;
  }

  if (!user) {
    return <Auth backendUrl={backendUrl} onAuthSuccess={handleAuthSuccess} />;
  }

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = products.filter(product => {
    const query = searchQuery.toLowerCase();
    const matchesName = product.name?.toLowerCase().includes(query);
    const matchesCategory = product.category?.toLowerCase().includes(query);
    const matchesDescription = product.description?.toLowerCase().includes(query);

    return matchesName || matchesCategory || matchesDescription;
  });

  const suits = filteredProducts.filter(p => p.category?.toLowerCase().includes('suit'));
  const shoes = filteredProducts.filter(p => p.category?.toLowerCase().includes('shoe'));
  const otherItems = filteredProducts.filter(p => !p.category?.toLowerCase().includes('suit') && !p.category?.toLowerCase().includes('shoe'));

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Account');

  const getProductImageUrl = (product) => {
    if (!product || !product.image) return null;
    let rawPath = String(product.image).replace(/[\u200b\u200c\u200d\ufeff]/g, '').trim();
    if (!rawPath || rawPath === 'null' || rawPath === 'undefined') return null;
    if (rawPath.startsWith('http')) return rawPath;
    rawPath = rawPath.replace(/^\/+/g, '/');
    if (!rawPath.startsWith('/')) {
      rawPath = '/' + rawPath;
    }
    return `http://localhost:5000${rawPath}`;
  };

  const normalizeVariantId = (variant, productId, index) => {
    if (!variant) return null;
    return variant.id || variant._id || `${productId}-${variant.size || 'variant'}-${index}`;
  };

  const renderProductCard = (product, index) => {
    const productId = product.id || product._id;
    const cartItem = cartItems.find(item => (item.id || item._id) === productId);
    const fullImageUrl = getProductImageUrl(product);
    const productVariants = product.variants || [];
    
    const totalStock = productVariants.length > 0
      ? productVariants.reduce((sum, v) => sum + Number(v.stock ?? v.quantity ?? 0), 0)
      : Number(product.stock ?? product.quantity ?? 0);

    const isOutOfStock = totalStock <= 0;

    return (
      <div 
        key={`${productId}-${index}`} 
        className="card"
        style={{
          opacity: isOutOfStock ? 0.75 : 1,
          position: 'relative'
        }}
        onClick={() => setSelectedProduct(product)}
      >
        {isOutOfStock && (
          <div className="out-of-stock-badge">OUT OF STOCK</div>
        )}

        <div className="image-wrapper">
          {fullImageUrl ? (
            <img 
              src={fullImageUrl} 
              alt={product.name} 
              className="image"
              style={{
                filter: isOutOfStock ? 'grayscale(50%)' : 'none'
              }}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/300x400?text=Image+Not+Found'; }}
            />
          ) : (
            <div className="no-image">No Image Available</div>
          )}
        </div>
        
        <div className="info-container">
          <h3 className="product-name">{product.name}</h3>
          
          {!isOutOfStock && totalStock <= 2 && (
            <p style={{ color: '#b36b00', fontSize: '10px', fontWeight: '700', margin: '0 0 4px 0' }}>
              🔥 Only {totalStock} left!
            </p>
          )}

          <p className="description">
            {product.description || 'Premium selection crafted for absolute comfort and modern elegance.'}
          </p>
          
          <div className="footer-row" onClick={(e) => e.stopPropagation()}>
            <span className="price">₦{Number(product.price).toLocaleString()}</span>
            
            {isOutOfStock ? (
              <button className="btn" style={{ backgroundColor: '#cccccc', color: '#666666', cursor: 'not-allowed' }} disabled>
                Out of Stock
              </button>
            ) : cartItem ? (
              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: '14px',
                  backgroundColor: '#eef7ee',
                  color: '#1f7a3f',
                  fontSize: '12px',
                  fontWeight: '700',
                  whiteSpace: 'nowrap'
                }}
              >
                {cartItem.quantity} in cart
              </span>
            ) : (
              <button className="btn" onClick={() => setSelectedProduct(product)}>
                View Options
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const shopView = (
    selectedProduct ? (
      <ProductDetail 
        selectedProduct={selectedProduct}
        cartItems={cartItems}
        selectedSize={selectedSize}
        setSelectedSize={setSelectedSize}
        handleCloseProductView={handleCloseProductView}
        handleAddToCart={handleAddToCart}
        handleUpdateQuantity={handleUpdateQuantity}
        deliveryData={deliveryData}
        setDeliveryData={setDeliveryData}
        getProductImageUrl={getProductImageUrl}
        normalizeVariantId={normalizeVariantId}
        styles={styles}
      />
    ) : (
      <>
        <section className="section">
          <h2 className="section-title">Bespoke Suits</h2>
          <div className="grid">
            {suits.length > 0 ? suits.map((product, index) => renderProductCard(product, index)) : (
              <p className="no-results-text">{searchQuery ? "No matching suits found." : "No suits loaded under this structural name layout."}</p>
            )}
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Luxury Shoes</h2>
          <div className="grid">
            {shoes.length > 0 ? shoes.map((product, index) => renderProductCard(product, index)) : (
              <p className="no-results-text">{searchQuery ? "No matching shoes found." : "No shoes loaded under this structural name layout."}</p>
            )}
          </div>
        </section>

        {otherItems.length > 0 && (
          <section className="section">
            <h2 className="section-title">Vault Collection</h2>
            <div className="grid">
              {otherItems.map((product, index) => renderProductCard(product, index))}
            </div>
          </section>
        )}

        {suits.length === 0 && shoes.length === 0 && otherItems.length === 0 && filteredProducts.length > 0 && (
          <section className="section">
            <h2 className="section-title">Store Inventory</h2>
            <div className="grid">
              {filteredProducts.map((product, index) => renderProductCard(product, index))}
            </div>
          </section>
        )}
      </>
    )
  );

  return (
    <div className="page-container">
      <nav className="navbar">
        <div className="nav-container">
          <div className="top-row-responsive">
            <button 
              className="menu-toggle-btn" 
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open Navigation Menu"
            >
              ☰
            </button>

            <Link 
              to="/" 
              className="brand-group"
              onClick={handleCloseProductView}
            >
              <img 
                src="/asset/logoo.jpg" 
                alt="EmmyBright Logo" 
                className="logo-image" 
                onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=EB'; }}
              />
              <div className="logo-text">EmmyBright</div>
            </Link>

            <div className="mobile-nav-links-right">
              <span className="cart-link" onClick={() => setIsCartOpen(true)}>
                🛒 ({totalCartCount})
              </span>
            </div>
          </div>
          
          {location.pathname === '/' && (
            <div className="search-container">
              <input 
                type="text" 
                placeholder="Search premium suits, shoes..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedProduct) handleCloseProductView();
                }} 
                className="search-input"
              />
              {searchQuery && <button className="clear-btn" onClick={() => setSearchQuery('')}>✕</button>}
            </div>
          )}

          <div className="desktop-nav-links-only">
            <NavLink 
              to="/" 
              end
              className="link-item" 
              onClick={handleCloseProductView}
            >
              Shop
            </NavLink>
            
            {user?.role?.toLowerCase() === 'admin' && (
              <NavLink 
                to="/admin" 
                className="link-item admin-link"
              >
                ⚙️ Admin Panel
              </NavLink>
            )}

            <NavLink to="/account" className="link-item">
              Hi {displayName}
            </NavLink>
            <span className="cart-link" onClick={() => setIsCartOpen(true)}>
              Cart ({totalCartCount})
            </span>
          </div>
        </div>
      </nav>

      {/* Side Navigation Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Responsive Side Navigation Menu */}
      <aside className={`sidebar-drawer ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link 
            to="/" 
            className="brand-group"
            onClick={() => {
              handleCloseProductView();
              setIsSidebarOpen(false);
            }}
          >
            <img 
              src="/asset/logoo.jpg" 
              alt="EmmyBright Logo" 
              className="logo-image" 
              onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=EB'; }}
            />
            <div className="logo-text">EmmyBright</div>
          </Link>
          <button 
            className="sidebar-close-btn"
            onClick={() => setIsSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="sidebar-links">
          <NavLink 
            to="/" 
            end
            className="sidebar-item" 
            onClick={() => {
              handleCloseProductView();
              setIsSidebarOpen(false);
            }}
          >
            ✨ Shop
          </NavLink>

          <NavLink 
            to="/account" 
            className="sidebar-item"
            onClick={() => setIsSidebarOpen(false)}
          >
            👤 Hi {displayName}
          </NavLink>

          <div 
            className="sidebar-item"
            onClick={() => {
              setIsCartOpen(true);
              setIsSidebarOpen(false);
            }}
          >
            🛒 Cart ({totalCartCount})
          </div>

          {user?.role?.toLowerCase() === 'admin' && (
            <NavLink 
              to="/admin" 
              className="sidebar-item admin-sidebar-link"
              onClick={() => setIsSidebarOpen(false)}
            >
              ⚙️ Admin Panel
            </NavLink>
          )}
        </div>
      </aside>

      {/* Mobile Navigation */}
      <div className="mobile-bottom-bar">
        <NavLink 
          to="/" 
          end
          className="mobile-bar-item"
          onClick={handleCloseProductView}
        >
          ✨ Shop
        </NavLink>
        {user?.role?.toLowerCase() === 'admin' && (
          <NavLink 
            to="/admin" 
            className="mobile-bar-item admin-mobile-link"
          >
            ⚙️ Admin
          </NavLink>
        )}
        <NavLink 
          to="/account" 
          className="mobile-bar-item"
        >
          👤 Hi {displayName}
        </NavLink>
      </div>

      <Cart 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        backendUrl={backendUrl}
        deliveryFee={deliveryData.fee}
        deliveryDetails={deliveryData.addressDetails}
        isDeliveryValid={deliveryData.isValid}
      />

      {error && <div className="error-alert">Error: {error}</div>}

      <main className="main-content">
        <Routes>
          <Route path="/" element={shopView} />

          <Route
            path="/account"
            element={
              <ProtectedRoute user={user}>
                <AccountPage
                  user={user}
                  onLogout={handleLogout}
                  backendUrl={backendUrl}
                  clearCart={clearCart}
                />
              </ProtectedRoute>
            }
          />
          
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute user={user} requiredRole="admin">
                <AdminPanel 
                  backendUrl={backendUrl} 
                  onProductsUpdated={fetchProducts} 
                />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<div style={{ textAlign: 'center', padding: '40px' }}>404 - Page Not Found</div>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;