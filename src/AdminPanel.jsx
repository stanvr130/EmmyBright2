import React, { useState, useEffect, useRef } from 'react';
import OrdersManager from './OrdersManager';
import api from './api/api'; // Custom Axios client instance
import './AdminPanel.css';

export default function AdminPanel({ 
  backendUrl = 'http://localhost:5000', 
  onProductsUpdated 
}) {
  // Tab State: 'inventory' | 'orders'
  const [activeTab, setActiveTab] = useState('inventory');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // 🆕 Click-to-zoom lightbox state: { url, name } | null
  const [zoomedImage, setZoomedImage] = useState(null);

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    variants: [{ size: '', color: '', stock: 0 }]
  });

  // Helper to format image URLs returned from backend
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('blob:')) {
      return imagePath;
    }
    return `${backendUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Helper to sync local state and alert parent container
  const handleDataChange = () => {
    fetchProducts();
    if (typeof onProductsUpdated === 'function') {
      onProductsUpdated();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index][field] = field === 'stock' ? parseInt(value, 10) || 0 : value;
    setFormData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const addVariantField = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { size: '', color: '', stock: 0 }]
    }));
  };

  const removeVariantField = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      variants: [{ size: '', color: '', stock: 0 }]
    });
    setImageFile(null);
    setImagePreview('');
    setIsEditing(false);
    setEditingId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const endpoint = isEditing ? `/products/${editingId}` : '/products';

    // Expand comma-separated sizes into individual variant objects
    const processedVariants = [];

    formData.variants.forEach((v) => {
      if (v.size && v.size.includes(',')) {
        const splitSizes = v.size.split(',').map((s) => s.trim()).filter(Boolean);
        splitSizes.forEach((singleSize) => {
          processedVariants.push({
            size: singleSize,
            color: v.color || '',
            stock: Number(v.stock) || 0
          });
        });
      } else {
        processedVariants.push({
          size: v.size ? v.size.trim() : '',
          color: v.color || '',
          stock: Number(v.stock) || 0
        });
      }
    });

    const dataToSend = new FormData();
    dataToSend.append('name', formData.name);
    dataToSend.append('description', formData.description);
    dataToSend.append('price', parseFloat(formData.price));
    dataToSend.append('category', formData.category);
    dataToSend.append('variants', JSON.stringify(processedVariants));

    if (imageFile) {
      dataToSend.append('image', imageFile);
    } else if (isEditing && imagePreview && !imagePreview.startsWith('blob:')) {
      const relativePath = imagePreview.replace(backendUrl, '');
      dataToSend.append('image', relativePath);
    }

    try {
      if (isEditing) {
        await api.put(endpoint, dataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post(endpoint, dataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setSuccessMsg(isEditing ? 'Product updated successfully!' : 'Product created successfully!');
      resetForm();
      handleDataChange();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to save product';
      setError(msg);
    }
  };

  const handleEditClick = (product) => {
    setIsEditing(true);
    setEditingId(product.id);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      category: product.category || '',
      variants: product.variants?.length > 0 
        ? product.variants 
        : [{ size: '', color: '', stock: 0 }]
    });
    setImageFile(null);
    setImagePreview(product.image ? getImageUrl(product.image) : '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/products/${id}`);
      setSuccessMsg('Product deleted successfully');
      handleDataChange();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to delete product');
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Admin Control Dashboard</h1>
        <p>Manage store inventory, catalog variants, and fulfill customer orders</p>
      </header>

      {/* Tab Navigation */}
      <div className="admin-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          style={{
            padding: '12px 24px',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            fontSize: '16px',
            fontWeight: activeTab === 'inventory' ? 'bold' : 'normal',
            borderBottom: activeTab === 'inventory' ? '3px solid #007bff' : '3px solid transparent',
            color: activeTab === 'inventory' ? '#007bff' : '#555'
          }}
        >
          🏷️ Catalog & Inventory
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '12px 24px',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            fontSize: '16px',
            fontWeight: activeTab === 'orders' ? 'bold' : 'normal',
            borderBottom: activeTab === 'orders' ? '3px solid #007bff' : '3px solid transparent',
            color: activeTab === 'orders' ? '#007bff' : '#555'
          }}
        >
          📦 Customer Orders
        </button>
      </div>

      {/* Render Orders Tab */}
      {activeTab === 'orders' && (
        <OrdersManager backendUrl={backendUrl} />
      )}

      {/* Render Inventory Tab */}
      {activeTab === 'inventory' && (
        <>
          {error && <div className="admin-alert error">{error}</div>}
          {successMsg && <div className="admin-alert success">{successMsg}</div>}

          <section className="admin-card">
            <h2>{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit} className="admin-form" encType="multipart/form-data">
              <div className="form-grid">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Price (₦) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Product Image</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {imagePreview && (
                    <div className="image-preview-container">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="form-image-preview"
                        style={{ cursor: 'zoom-in' }}
                        title="Click to enlarge"
                        onClick={() => setZoomedImage({ url: imagePreview, name: formData.name || 'Product Preview' })}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                ></textarea>
              </div>

              <div className="variants-section">
                <h3>Variants & Stock</h3>
                {formData.variants.map((variant, index) => (
                  <div key={variant.id || `variant-field-${index}`} className="variant-row">
                    <input
                      type="text"
                      placeholder="Size (e.g. 44, 46, 48 or L)"
                      value={variant.size || ''}
                      onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Color (e.g. Black)"
                      value={variant.color || ''}
                      onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      value={variant.stock}
                      onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                      min="0"
                    />
                    {formData.variants.length > 1 && (
                      <button
                        type="button"
                        className="btn-danger-sm"
                        onClick={() => removeVariantField(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={addVariantField}
                >
                  + Add Variant Option
                </button>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {isEditing ? 'Update Product' : 'Save Product'}
                </button>
                {isEditing && (
                  <button type="button" className="btn-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Inventory Table */}
          <section className="admin-card">
            <h2>Existing Inventory</h2>
            {loading ? (
              <p>Loading inventory...</p>
            ) : products.length === 0 ? (
              <p>No products found in the catalog.</p>
            ) : (
              <div className="table-wrapper">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Variants / Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod) => (
                      <tr key={prod.id}>
                        <td>#{prod.id}</td>
                        <td>
                          {prod.image ? (
                            <img
                              src={getImageUrl(prod.image)}
                              alt={prod.name}
                              className="table-thumb"
                              style={{ cursor: 'zoom-in' }}
                              title="Click to enlarge"
                              onClick={() => setZoomedImage({ url: getImageUrl(prod.image), name: prod.name })}
                            />
                          ) : (
                            <span className="no-img">No Image</span>
                          )}
                        </td>
                        <td><strong>{prod.name}</strong></td>
                        <td>{prod.category}</td>
                        <td>₦{Number(prod.price).toLocaleString()}</td>
                        <td>
                          {prod.variants?.length > 0 ? (
                            <ul className="variant-list">
                              {prod.variants.map((v, idx) => (
                                <li key={v.id || `v-${prod.id}-${idx}`}>
                                  {v.size && `Size: ${v.size} `}
                                  {v.color && `Color: ${v.color} `}
                                  <strong>(Stock: {v.stock})</strong>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <em>No variants</em>
                          )}
                        </td>
                        <td className="action-cells">
                          <button
                            className="btn-edit"
                            onClick={() => handleEditClick(prod)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteClick(prod.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* 🆕 Click-to-Zoom Image Lightbox */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          style={{
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
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'default'
            }}
          >
            <button
              onClick={() => setZoomedImage(null)}
              title="Close"
              style={{
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
              }}
            >
              ✕ Close
            </button>
            <img
              src={zoomedImage.url}
              alt={zoomedImage.name}
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '6px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.4)'
              }}
            />
            <div style={{ marginTop: '12px', color: '#fff', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>
              {zoomedImage.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}