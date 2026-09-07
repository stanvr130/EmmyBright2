import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Cart from './Cart'; 
import Auth from './Auth'; 
import AdminPanel from './AdminPanel';
import AccountPage from './AccountPage';
import ContactUs from './ContactUs';
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

const LOGO_SRC = '/asset/logoo.png';
const LOGO_FALLBACK = 'https://via.placeholder.com/50?text=EB';

function App() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(''); 

  // CATEGORY FILTER STATE (for the new category bar)
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null); // null = "All"
  
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

  // LOGO IMAGE STATE — one guarded retry (in case of a transient/dev-only
  // aborted fetch), then falls back to a placeholder and logs the exact
  // URL that failed so the real cause (wrong path/case/extension) is easy
  // to spot in the browser console.
  const [logoSrc, setLogoSrc] = useState(LOGO_SRC);
  const [logoRetried, setLogoRetried] = useState(false);
  
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

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleAuthSuccess = async (authenticatedUser) => {
    setUser(authenticatedUser);

    // If the user was sent here from ProtectedRoute (e.g. tried to open
    // /account or /admin directly), location.state.from tells us where to
    // send them back to. If they were sent here mid-checkout, we instead
    // want to land on "/" and reopen the cart so they can finish.
    const hadPendingCheckout = sessionStorage.getItem('eb_pendingCheckout') === 'true';
    const redirectTarget = location.state?.from;

    if (hadPendingCheckout) {
      sessionStorage.removeItem('eb_pendingCheckout');
    }

    navigate(hadPendingCheckout ? '/' : (redirectTarget || '/'));

    try {
      // Don't clobber the guest's in-progress cart with whatever (likely
      // empty) cart the backend has saved for this account — they were
      // mid-checkout and their items are still sitting in local state.
      if (!hadPendingCheckout) {
        const cartResponse = await api.get('/cart');
        if (cartResponse.data && cartResponse.data.cartItems) {
          setCartItems(cartResponse.data.cartItems);
          localStorage.setItem('eb_cartItems', JSON.stringify(cartResponse.data.cartItems));
        }
      }

      const deliveryResponse = await api.get('/delivery');
      if (deliveryResponse.data && deliveryResponse.data.deliveryData) {
        setDeliveryData(deliveryResponse.data.deliveryData);
        localStorage.setItem('eb_deliveryData', JSON.stringify(deliveryResponse.data.deliveryData));
      }
    } catch (err) {
      console.error("Error restoring remote database variables context on authorization sync:", err);
    }

    if (hadPendingCheckout) {
      setIsCartOpen(true);
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

  // Selecting a category from the category bar or sidebar — filters the
  // homepage to just that category. Passing null resets to "All".
  const handleSelectCategory = (categoryId) => {
    setActiveCategoryId(categoryId);
    handleCloseProductView();
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  // Guarded logo error handler. First failure gets one retry with a
  // cache-busting query param. If that also fails, we know it's a real
  // 404/path issue (not a transient dev-mode double-fetch), so we log the
  // exact URL that failed and fall back to the placeholder.
  const handleLogoError = (e) => {
    if (!logoRetried) {
      setLogoRetried(true);
      setLogoSrc(`${LOGO_SRC}?retry=${Date.now()}`);
    } else {
      console.error(
        `EmmyBright logo failed to load. Last attempted URL: ${e.target.src} — ` +
        `check that the file actually exists at public${LOGO_SRC} (case-sensitive, correct extension).`
      );
      setLogoSrc(LOGO_FALLBACK);
    }
  };

  if (!checkedAuth) {
    return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>Loading EmmyBright...</div>;
  }

  // NOTE: the old hard gate that forced <Auth /> for every guest has been
  // removed — the storefront, product details, search, and categories are
  // now all public. Login is only required at /account, /admin, and at
  // checkout (enforced inside Cart.jsx and ProtectedRoute.jsx).

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Helper — safely reads the category name/id off a product regardless of
  // whether it came from /products (nested categoryRef) or elsewhere.
  const getCategoryName = (product) => product.categoryRef?.name || 'Uncategorized';
  const getCategoryId = (product) => product.categoryRef?.id ?? product.categoryId ?? null;

  const filteredProducts = products.filter(product => {
    const query = searchQuery.toLowerCase();
    const matchesName = product.name?.toLowerCase().includes(query);
    const matchesCategory = getCategoryName(product).toLowerCase().includes(query);
    const matchesDescription = product.description?.toLowerCase().includes(query);
    const matchesSearch = matchesName || matchesCategory || matchesDescription;

    const matchesActiveCategory = activeCategoryId === null || getCategoryId(product) === activeCategoryId;

    return matchesSearch && matchesActiveCategory;
  });

  // Group products dynamically by their real category name instead of
  // hardcoding "suit"/"shoe" — any category created in the admin panel
  // automatically gets its own section here.
  const productsByCategory = filteredProducts.reduce((groups, product) => {
    const categoryName = getCategoryName(product);
    if (!groups[categoryName]) {
      groups[categoryName] = [];
    }
    groups[categoryName].push(product);
    return groups;
  }, {});

  const sortedCategoryNames = Object.keys(productsByCategory).sort((a, b) => {
    // Keep "Uncategorized" pinned last, everything else alphabetical
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Account');
  const isAdmin = user?.role?.toLowerCase() === 'admin';

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

  // Reusable category bar — small text, horizontal scroll, "All" + real categories
  const renderCategoryBar = (extraClassName = '') => (
    <div className={`category-bar ${extraClassName}`}>
      <button
        type="button"
        className={`category-bar-item ${activeCategoryId === null ? 'active' : ''}`}
        onClick={() => handleSelectCategory(null)}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          type="button"
          key={cat.id}
          className={`category-bar-item ${activeCategoryId === cat.id ? 'active' : ''}`}
          onClick={() => handleSelectCategory(cat.id)}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );

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
        {sortedCategoryNames.length > 0 ? (
          sortedCategoryNames.map((categoryName) => (
            <section className="section" key={categoryName}>
              <h2 className="section-title">{categoryName}</h2>
              <div className="grid">
                {productsByCategory[categoryName].map((product, index) =>
                  renderProductCard(product, index)
                )}
              </div>
            </section>
          ))
        ) : (
          <section className="section">
            <h2 className="section-title">Store Inventory</h2>
            <p className="no-results-text">
              {searchQuery || activeCategoryId !== null ? 'No matching products found.' : 'No products available yet.'}
            </p>
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
                src={logoSrc}
                alt="EmmyBright Logo" 
                className="logo-image"
                width="38"
                height="38"
                onError={handleLogoError}
              />
              <div className="logo-text">EmmyBright</div>
            </Link>

            <div className="mobile-nav-links-right">
              <span className="cart-link" onClick={() => setIsCartOpen(true)}>
                🛒 ({totalCartCount})
              </span>
            </div>
          </div>

          {/* Desktop nav links: Shop, Hi {name}/Login, Contact Us, Admin (if applicable) */}
          <div className="desktop-nav-links-only">
            <NavLink 
              to="/" 
              end
              className="link-item" 
              onClick={handleCloseProductView}
            >
              Shop
            </NavLink>

            {user ? (
              <NavLink to="/account" className="link-item">
                Hi {displayName}
              </NavLink>
            ) : (
              <NavLink to="/login" className="link-item">
                Login
              </NavLink>
            )}

            <NavLink 
              to="/contact" 
              className="link-item"
            >
              Contact Us
            </NavLink>

            {isAdmin && (
              <NavLink 
                to="/admin" 
                className="link-item admin-link"
              >
                ⚙️ Admin Panel
              </NavLink>
            )}
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
        </div>

        {/* CATEGORY BAR — small text, horizontal, below main navbar. Shown on desktop and mobile. */}
        {location.pathname === '/' && renderCategoryBar('category-bar-desktop')}
        {location.pathname === '/' && renderCategoryBar('category-bar-mobile')}
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

          {user ? (
            <NavLink 
              to="/account" 
              className="sidebar-item"
              onClick={() => setIsSidebarOpen(false)}
            >
              👤 Hi {displayName}
            </NavLink>
          ) : (
            <NavLink 
              to="/login" 
              className="sidebar-item"
              onClick={() => setIsSidebarOpen(false)}
            >
              👤 Login
            </NavLink>
          )}

          <NavLink 
            to="/contact" 
            className="sidebar-item"
            onClick={() => setIsSidebarOpen(false)}
          >
            📞 Contact Us
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

          {isAdmin && (
            <NavLink 
              to="/admin" 
              className="sidebar-item admin-sidebar-link"
              onClick={() => setIsSidebarOpen(false)}
            >
              ⚙️ Admin Panel
            </NavLink>
          )}

          {/* Categories — added underneath the main links, as requested */}
          <div className="sidebar-section-label">Categories</div>
          <div
            className={`sidebar-item ${activeCategoryId === null ? 'active' : ''}`}
            onClick={() => {
              handleSelectCategory(null);
              setIsSidebarOpen(false);
            }}
          >
            All
          </div>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`sidebar-item ${activeCategoryId === cat.id ? 'active' : ''}`}
              onClick={() => {
                handleSelectCategory(cat.id);
                setIsSidebarOpen(false);
              }}
            >
              {cat.name}
            </div>
          ))}
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
        {isAdmin && (
          <NavLink 
            to="/admin" 
            className="mobile-bar-item admin-mobile-link"
          >
            ⚙️ Admin
          </NavLink>
        )}
        {user ? (
          <NavLink 
            to="/account" 
            className="mobile-bar-item"
          >
            👤 Hi {displayName}
          </NavLink>
        ) : (
          <NavLink 
            to="/login" 
            className="mobile-bar-item"
          >
            👤 Login
          </NavLink>
        )}
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
        user={user}
      />

      {error && <div className="error-alert">Error: {error}</div>}

      <main className="main-content">
        <Routes>
          <Route path="/" element={shopView} />

          <Route path="/contact" element={<ContactUs />} />

          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/" replace />
              ) : (
                <Auth backendUrl={backendUrl} onAuthSuccess={handleAuthSuccess} />
              )
            }
          />

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