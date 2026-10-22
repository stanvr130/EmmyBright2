import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Cart from './Cart'; 
import Auth from './Auth'; 
import AdminPanel from './AdminPanel';
import AccountPage from './AccountPage';
import ContactUs from './ContactUs';
import ProtectedRoute from './ProtectedRoute';
import ProductDetail from './ProductDetail';
import CategoriesPage from './CategoriesPage';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';
import ReturnPolicy from './ReturnPolicy';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';
import LandingHero from './LandingHero';
import DeliveryAnimation from './DeliveryAnimation';
import ProductRow from './ProductRow';
import api from './api/api'; 
import './App.css';

// Set to false to glide to the top even on devices with "reduce motion" switched on
const RESPECT_REDUCED_MOTION = true;

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
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(''); 

  // CATEGORY FILTER STATE
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null); // null = "All"
  
  // PRODUCT DETAIL VIEW STATE
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  // USER / AUTHENTICATION STATES
  const [user, setUser] = useState(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  // GLOBAL CART STATES
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('eb_cartItems');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // WISHLIST STATE
  const [wishlistItems, setWishlistItems] = useState([]);

  // WISHLIST POPUP (TOAST)
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = (message) => {
    clearTimeout(toastTimerRef.current);
    setToast({ message, id: Date.now() });
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

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

  const backendUrl = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';
  const navigate = useNavigate();
  const location = useLocation();

  // Glide to the top. It waits two frames so the new page has been laid out;
  // otherwise the browser can cancel the glide when the page height changes.
  const scrollToTop = () => {
    const reduceMotion =
      RESPECT_REDUCED_MOTION && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      window.scrollTo(0, 0);
      return;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  };

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
    } finally {
      setProductsLoading(false);
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

  const fetchWishlist = async () => {
    if (!localStorage.getItem('authToken')) {
      setWishlistItems([]);
      return;
    }
    try {
      const response = await api.get('/wishlist');
      setWishlistItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchWishlist();
  }, []);

  // Glide to the top on every page change and every category change.
  // The first run is skipped so a page reload keeps the browser's own scroll position.
  const isFirstScrollRun = useRef(true);
  useEffect(() => {
    if (isFirstScrollRun.current) {
      isFirstScrollRun.current = false;
      return;
    }
    scrollToTop();
  }, [location.pathname, activeCategoryId]);

  // Opening a product is a state change, not a page change, so it needs its own trigger
  useEffect(() => {
    if (selectedProduct) scrollToTop();
  }, [selectedProduct]);

  const isInWishlist = (productId) => wishlistItems.some(item => (item.id || item._id) === productId);

  const handleToggleWishlist = async (productId) => {
    if (!localStorage.getItem('authToken')) {
      navigate('/login');
      return;
    }
    try {
      if (isInWishlist(productId)) {
        await api.delete(`/wishlist/${productId}`);
        setWishlistItems((prev) => prev.filter(item => (item.id || item._id) !== productId));
        showToast('Item removed from wishlist');
      } else {
        await api.post('/wishlist', { productId });
        showToast('Item added to wishlist');
        fetchWishlist(); // refetch to get full product data for the new item
      }
    } catch (err) {
      console.error('Error updating wishlist:', err);
      showToast('Could not update wishlist. Please try again.');
    }
  };

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

      fetchWishlist();
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

  // "Shop" (logo, desktop link, sidebar, bottom tab): back to the plain
  // homepage with no category filter, no search and no open product.
  const handleGoHome = () => {
    setActiveCategoryId(null);
    setSearchQuery('');
    handleCloseProductView();
    scrollToTop();
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
      setWishlistItems([]);
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

  // Selecting a category from the category bar, sidebar, landing tiles, the
  // categories page or a section heading. Passing null resets to "All".
  // The glide to the top is handled by the effects above; the same-category
  // case is covered here because no state changes then.
  const handleSelectCategory = (categoryId) => {
    const alreadyThere = categoryId === activeCategoryId && location.pathname === '/';
    setActiveCategoryId(categoryId);
    handleCloseProductView();
    if (location.pathname !== '/') {
      navigate('/');
    }
    if (alreadyThere) scrollToTop();
  };

  // Search box (lives inside Navbar): typing also closes any open product view
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (selectedProduct) handleCloseProductView();
  };

  if (!checkedAuth) {
    return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>Loading EmmyBright...</div>;
  }

  // NOTE: the storefront, product details, search, and categories are all
  // public. Login is only required at /account, /admin, /wishlist, and at
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

  // Group products dynamically by their real category name — any category
  // created in the admin panel automatically gets its own section here.
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

  // Clicking a category heading in the product list filters the page to that category
  const handleCategoryHeadingClick = (categoryName) => {
    const firstProduct = productsByCategory[categoryName]?.[0];
    const categoryId = firstProduct ? getCategoryId(firstProduct) : null;
    if (categoryId !== null) {
      handleSelectCategory(categoryId);
    }
  };

  const getProductImageUrl = (product) => {
    if (!product || !product.image) return null;
    let rawPath = String(product.image).replace(/[\u200b\u200c\u200d\ufeff]/g, '').trim();
    if (!rawPath || rawPath === 'null' || rawPath === 'undefined') return null;
    if (rawPath.startsWith('http')) return rawPath;
    rawPath = rawPath.replace(/^\/+/g, '/');
    if (!rawPath.startsWith('/')) {
      rawPath = '/' + rawPath;
    }
    return `${backendUrl}${rawPath}`;
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
    const wishlisted = isInWishlist(productId);
    
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

        <button
          type="button"
          className={`wishlist-heart-btn ${wishlisted ? 'wishlisted' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleWishlist(productId);
          }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {wishlisted ? '♥' : '♡'}
        </button>

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

  // One ProductDetail instance used by both the shop and wishlist views
  const productDetailView = (
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
      isInWishlist={isInWishlist}
      handleToggleWishlist={handleToggleWishlist}
    />
  );

  const shopView = (
    selectedProduct ? productDetailView : (
      <>
        {location.pathname === '/' && !searchQuery && activeCategoryId === null && (
          <LandingHero
            categories={categories}
            products={products}
            getProductImageUrl={getProductImageUrl}
            onSelectCategory={handleSelectCategory}
            onShopNow={() =>
              document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          />
        )}

        <div id="products" className="products-anchor">
          {productsLoading && products.length === 0 ? (
            <div className="eb-loading" role="status" aria-live="polite">
              <div className="eb-spinner" aria-hidden="true" />
              <p className="eb-loading-text">Loading products…</p>
              <p className="eb-loading-hint">
                Still working on it. The store is waking up, thanks for waiting.
              </p>
            </div>
          ) : sortedCategoryNames.length > 0 ? (
            sortedCategoryNames.map((categoryName) => (
              <section className="section" key={categoryName}>
                <h2 className="section-title">
                  {categoryName === 'Uncategorized' ? (
                    categoryName
                  ) : (
                    <button
                      type="button"
                      className="section-title-link"
                      title={`See ${categoryName} only`}
                      onClick={() => handleCategoryHeadingClick(categoryName)}
                    >
                      {categoryName}
                    </button>
                  )}
                </h2>
                {activeCategoryId === null && !searchQuery ? (
                  <ProductRow>
                    {productsByCategory[categoryName].map((product, index) =>
                      renderProductCard(product, index)
                    )}
                  </ProductRow>
                ) : (
                  <div className="grid">
                    {productsByCategory[categoryName].map((product, index) =>
                      renderProductCard(product, index)
                    )}
                  </div>
                )}
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
        </div>
      </>
    )
  );

  // Products an admin has hidden disappear from wishlists too
  const visibleWishlistItems = wishlistItems.filter((product) => !product.isArchived);

  const wishlistView = (
    selectedProduct ? productDetailView : (
      <section className="section">
        <h2 className="section-title">Your Wishlist</h2>
        {visibleWishlistItems.length > 0 ? (
          <div className="grid">
            {visibleWishlistItems.map((product, index) => renderProductCard(product, index))}
          </div>
        ) : (
          <p className="no-results-text">You haven't saved any products yet.</p>
        )}
      </section>
    )
  );

  return (
    <div className="page-container">
      <Navbar
        user={user}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={handleSelectCategory}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onClearSearch={() => setSearchQuery('')}
        onCloseProductView={handleCloseProductView}
        onGoHome={handleGoHome}
      />

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

          <Route 
            path="/wishlist" 
            element={
              <ProtectedRoute user={user}>
                {wishlistView}
              </ProtectedRoute>
            } 
          />

          <Route
            path="/categories"
            element={
              <CategoriesPage
                categories={categories}
                products={products}
                getProductImageUrl={getProductImageUrl}
                onSelectCategory={handleSelectCategory}
              />
            }
          />

          <Route path="/contact" element={<ContactUs />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/returns" element={<ReturnPolicy />} />

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

      <Footer />
      <WhatsAppButton />
      <DeliveryAnimation />

      {toast && (
        <div key={toast.id} className="eb-toast" role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;