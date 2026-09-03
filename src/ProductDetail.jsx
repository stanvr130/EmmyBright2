import React, { useState } from 'react';
import DeliveryDetails from './DeliveryDetails';

export default function ProductDetail({
  selectedProduct,
  cartItems,
  selectedSize,
  setSelectedSize,
  handleCloseProductView,
  handleAddToCart,
  handleUpdateQuantity,
  deliveryData,
  setDeliveryData,
  getProductImageUrl,
  normalizeVariantId,
  styles
}) {
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  if (!selectedProduct) return null;

  const rawSelectedVariants = selectedProduct.variants || [];
  const selectedProductId = selectedProduct.id || selectedProduct._id;
  const selectedVariants = rawSelectedVariants.map((v, idx) => ({
    ...v,
    id: normalizeVariantId(v, selectedProductId, idx)
  }));

  const validSizes = selectedVariants.filter(v => v.size && v.size !== 'Standard');
  const hasMultipleSizes = validSizes.length > 0;

  const activeVariant = hasMultipleSizes ? selectedSize : selectedVariants[0];
  const activeCartId = activeVariant ? activeVariant.id : selectedProductId;
  const singleViewCartItem = cartItems.find(
    item => (item.variantId || item.id || item._id) === activeCartId
  );

  const imageUrl = getProductImageUrl(selectedProduct);

  return (
    <div className="single-view-container">
      <button className="back-btn" onClick={handleCloseProductView}>
        ← Back to Collection
      </button>

      <div className="details-flex-layout">
        {/* Compact Product Image Column */}
        <div className="single-image-column">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={selectedProduct.name} 
              className="single-large-image"
              style={{ cursor: 'zoom-in' }}
              onClick={() => setIsImageExpanded(true)}
              onError={(e) => { 
                e.target.src = 'https://via.placeholder.com/220x260?text=Product+Image'; 
              }}
            />
          ) : (
            <div className="single-no-image">No Image Available</div>
          )}
        </div>

        {/* Product Info & Action Column */}
        <div className="single-info-column">
          <span className="luxury-category-tag">
            {selectedProduct.category || 'Luxury Wardrobe'}
          </span>
          <h1 className="single-product-name">{selectedProduct.name}</h1>
          <div className="single-price-tag">
            ₦{Number(selectedProduct.price).toLocaleString()}
          </div>
          
          <div className="divider-line" />
          
          <h3 className="section-sub-heading">Product Narrative</h3>
          <p className="single-description-text">
            {selectedProduct.description || 'This luxury bespoke selection is carefully structured to reflect perfect dynamic identity contours.'}
          </p>

          {/* Size Options */}
          {hasMultipleSizes && (
            <div style={{ marginBottom: '24px' }}>
              <h3 className="section-sub-heading">Select Size Choice</h3>
              <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '10px' }}>
                {validSizes.map((variant) => {
                  const isChosen = selectedSize?.id === variant.id;
                  const isVariantOutOfStock = Number(variant.stock ?? variant.quantity ?? 0) <= 0;
                  return (
                    <button
                      key={variant.id}
                      disabled={isVariantOutOfStock}
                      style={{
                        border: '1px solid #ddd',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: isVariantOutOfStock ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        backgroundColor: isChosen ? '#1a1a1a' : isVariantOutOfStock ? '#f5f5f5' : '#ffffff',
                        color: isChosen ? '#ffffff' : isVariantOutOfStock ? '#aaaaaa' : '#1a1a1a',
                        borderColor: isChosen ? '#1a1a1a' : '#ddd',
                        textDecoration: isVariantOutOfStock ? 'line-through' : 'none'
                      }}
                      onClick={() => setSelectedSize(variant)}
                    >
                      {variant.size} {isVariantOutOfStock && '(Out of stock)'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cart & Option Actions */}
          <div className="single-action-row">
            {hasMultipleSizes && !selectedSize ? (
              <div style={{ backgroundColor: '#c2c0b9', border: '1px solid #c4bfa9', color: '#0f0f0f', padding: '12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500' }}>
                 Please select an available size to proceed
              </div>
            ) : singleViewCartItem ? (
              <div className="inline-qty-row" style={{ maxWidth: '200px', height: '44px' }}>
                <button 
                  className="inline-qty-btn" 
                  onClick={() => handleUpdateQuantity(activeCartId, singleViewCartItem.quantity - 1)}
                >
                  -
                </button>
                <span className="inline-qty-text">{singleViewCartItem.quantity}</span>
                <button 
                  className="inline-qty-btn" 
                  onClick={() => handleUpdateQuantity(activeCartId, singleViewCartItem.quantity + 1)}
                >
                  +
                </button>
              </div>
            ) : (
              <button 
                className="single-add-to-cart-btn" 
                onClick={() => handleAddToCart(selectedProduct, activeVariant)}
              >
                Add Premium Item to Cart
              </button>
            )}
          </div>

          {/* Integrated Delivery Details */}
          <div className="integrated-delivery-wrapper">
            <DeliveryDetails 
              initialData={deliveryData}
              onDeliveryChange={(updatedDeliveryState) => setDeliveryData(updatedDeliveryState)}
              styles={styles}
            />
          </div>

        </div>
      </div>

      {/* Expanded Lightbox Modal */}
      {isImageExpanded && imageUrl && (
        <div 
          style={lightboxStyles.overlay} 
          onClick={() => setIsImageExpanded(false)}
        >
          <div 
            style={lightboxStyles.contentContainer} 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              style={lightboxStyles.closeBtn} 
              onClick={() => setIsImageExpanded(false)}
              aria-label="Close Preview"
            >
              ✕
            </button>
            <img 
              src={imageUrl} 
              alt={selectedProduct.name} 
              style={lightboxStyles.expandedImage} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

const lightboxStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(4px)',
    zIndex: 3000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
  },
  contentContainer: {
    position: 'relative',
    maxWidth: '90vw',
    maxHeight: '90vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  expandedImage: {
    maxWidth: '90vw',
    maxHeight: '85vh',
    objectFit: 'contain',
    borderRadius: '8px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
  },
  closeBtn: {
    position: 'absolute',
    top: '-15px',
    right: '-15px',
    backgroundColor: '#ffffff',
    color: '#000000',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
    zIndex: 3001
  }
};