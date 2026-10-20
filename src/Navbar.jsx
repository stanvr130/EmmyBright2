import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const LOGO_SRC = '/asset/logoo.png';
const LOGO_FALLBACK = 'https://via.placeholder.com/50?text=EB';

// How many category chips always show in the navbar (before "See more")
const MAX_VISIBLE_CATEGORIES = 3;

// true  = categories slide away while the page moves DOWN, and return when you move back UP
// false = the opposite
const HIDE_WHEN_SCROLLING_DOWN = true;
const SCROLL_THRESHOLD_PX = 8;   // ignore tiny movements
const SHOW_NEAR_TOP_PX = 40;     // always visible this close to the top

export default function Navbar({
  user,
  cartCount,
  onOpenCart,
  categories = [],
  activeCategoryId,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onClearSearch,
  onCloseProductView
}) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  // SIDEBAR NAVIGATION STATE
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // LOGO IMAGE STATE
  const [logoSrc, setLogoSrc] = useState(LOGO_SRC);
  const [logoRetried, setLogoRetried] = useState(false);

  // CATEGORY CHIPS: hide / show on scroll
  const [hideCats, setHideCats] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    setHideCats(false);
    if (!isHome) return undefined;

    lastScrollY.current = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastScrollY.current;

        if (y < SHOW_NEAR_TOP_PX) {
          setHideCats(false);
          lastScrollY.current = y;
        } else if (Math.abs(delta) > SCROLL_THRESHOLD_PX) {
          const movingDown = delta > 0;
          setHideCats(HIDE_WHEN_SCROLLING_DOWN ? movingDown : !movingDown);
          lastScrollY.current = y;
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  const displayName =
    (user?.name ? user.name.trim().split(' ')[0] : null) ||
    (user?.email ? user.email.split('@')[0] : 'Account');
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const closeSidebar = () => setIsSidebarOpen(false);

  // The first few categories always show. If the shopper picked a category
  // that isn't one of them (e.g. from the categories page), it takes the
  // last slot so the active filter is never hidden.
  const visibleCategories = (() => {
    const firstFew = categories.slice(0, MAX_VISIBLE_CATEGORIES);
    if (activeCategoryId !== null && !firstFew.some((c) => c.id === activeCategoryId)) {
      const active = categories.find((c) => c.id === activeCategoryId);
      if (active) return [...firstFew.slice(0, MAX_VISIBLE_CATEGORIES - 1), active];
    }
    return firstFew;
  })();
  const hasMoreCategories = categories.length > MAX_VISIBLE_CATEGORIES;

  // Guarded logo error handler: one retry with a cache-busting param, then a placeholder.
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

  return (
    <>
      <nav className="eb-nav">
        <div className="eb-nav-inner">
          <button
            className="menu-toggle-btn"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open Navigation Menu"
          >
            ☰
          </button>

          <Link to="/" className="brand-group" onClick={onCloseProductView}>
            <img
              src={logoSrc}
              alt="EmmyBright Logo"
              className="logo-image"
              width="26"
              height="26"
              onError={handleLogoError}
            />
            <div className="logo-text">EmmyBright</div>
          </Link>

          {/* Desktop links: Shop, Contact us, Wishlist, Hi {name}/Login, Admin */}
          <div className="desktop-nav-links-only">
            <NavLink to="/" end className="link-item" onClick={onCloseProductView}>
              Shop
            </NavLink>

            <NavLink to="/contact" className="link-item">
              Contact us
            </NavLink>

            <NavLink to="/wishlist" className="link-item" onClick={onCloseProductView}>
              ♡ Wishlist
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

            {isAdmin && (
              <NavLink to="/admin" className="link-item admin-link">
                ⚙️ Admin panel
              </NavLink>
            )}
          </div>

          {isHome && (
            <div className="search-container">
              <input
                type="text"
                placeholder="Search premium suits, shoes..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button className="clear-btn" onClick={onClearSearch} aria-label="Clear search">
                  ✕
                </button>
              )}
            </div>
          )}

          <span className="cart-link" onClick={onOpenCart}>
            🛒 ({cartCount})
          </span>
        </div>

        {/* Floating category chips: 3 categories + "See more" */}
        {isHome && categories.length > 0 && (
          <div
            className={`eb-nav-cats ${hideCats ? 'is-hidden' : ''}`}
            aria-hidden={hideCats}
          >
            <button
              type="button"
              className={`eb-nav-cat ${activeCategoryId === null ? 'active' : ''}`}
              onClick={() => onSelectCategory(null)}
            >
              All
            </button>

            {visibleCategories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                className={`eb-nav-cat ${activeCategoryId === cat.id ? 'active' : ''}`}
                onClick={() => onSelectCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}

            {hasMoreCategories && (
              <Link
                to="/categories"
                className="eb-nav-cat eb-nav-more"
                aria-label="See all categories"
                title="See all categories"
                onClick={onCloseProductView}
              >
                <span aria-hidden="true">…</span>
                <span className="eb-more-label">See more</span>
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* Reserves room under the navbar for the floating chips (home page only) */}
      {isHome && categories.length > 0 && <div className="eb-nav-spacer" aria-hidden="true" />}

      {/* Side Navigation Overlay Backdrop */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      {/* Responsive Side Navigation Menu */}
      <aside className={`sidebar-drawer ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link
            to="/"
            className="brand-group"
            onClick={() => {
              onCloseProductView();
              closeSidebar();
            }}
          >
            <div className="logo-text">EmmyBright</div>
          </Link>
          <button className="sidebar-close-btn" onClick={closeSidebar}>
            ✕
          </button>
        </div>

        <div className="sidebar-links">
          <NavLink
            to="/"
            end
            className="sidebar-item"
            onClick={() => {
              onCloseProductView();
              closeSidebar();
            }}
          >
            ✨ Shop
          </NavLink>

          <NavLink
            to="/wishlist"
            className="sidebar-item"
            onClick={() => {
              onCloseProductView();
              closeSidebar();
            }}
          >
            ♡ Wishlist
          </NavLink>

          {user ? (
            <NavLink to="/account" className="sidebar-item" onClick={closeSidebar}>
              👤 Hi {displayName}
            </NavLink>
          ) : (
            <NavLink to="/login" className="sidebar-item" onClick={closeSidebar}>
              👤 Login
            </NavLink>
          )}

          <NavLink to="/contact" className="sidebar-item" onClick={closeSidebar}>
            📞 Contact Us
          </NavLink>

          <div
            className="sidebar-item"
            onClick={() => {
              onOpenCart();
              closeSidebar();
            }}
          >
            🛒 Cart ({cartCount})
          </div>

          {isAdmin && (
            <NavLink
              to="/admin"
              className="sidebar-item admin-sidebar-link"
              onClick={closeSidebar}
            >
              ⚙️ Admin Panel
            </NavLink>
          )}

          {/* Categories */}
          <div className="sidebar-section-label">Categories</div>
          <div
            className={`sidebar-item ${activeCategoryId === null ? 'active' : ''}`}
            onClick={() => {
              onSelectCategory(null);
              closeSidebar();
            }}
          >
            All
          </div>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`sidebar-item ${activeCategoryId === cat.id ? 'active' : ''}`}
              onClick={() => {
                onSelectCategory(cat.id);
                closeSidebar();
              }}
            >
              {cat.name}
            </div>
          ))}
          <NavLink
            to="/categories"
            className="sidebar-item"
            onClick={() => {
              onCloseProductView();
              closeSidebar();
            }}
          >
            Browse all categories →
          </NavLink>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <div className="mobile-bottom-bar">
        <NavLink to="/" end className="mobile-bar-item" onClick={onCloseProductView}>
          ✨ Shop
        </NavLink>
        <NavLink to="/wishlist" className="mobile-bar-item" onClick={onCloseProductView}>
          ♡ Wishlist
        </NavLink>
        {isAdmin && (
          <NavLink to="/admin" className="mobile-bar-item admin-mobile-link">
            ⚙️ Admin
          </NavLink>
        )}
        {user ? (
          <NavLink to="/account" className="mobile-bar-item">
            👤 Hi {displayName}
          </NavLink>
        ) : (
          <NavLink to="/login" className="mobile-bar-item">
            👤 Login
          </NavLink>
        )}
      </div>
    </>
  );
}