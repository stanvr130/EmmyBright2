import React, { useState, useEffect, useRef, useMemo } from 'react';
import OrdersManager from './OrdersManager';
import api from './api/api'; // Custom Axios client instance
import './AdminPanel.css';

const normalize = (value) => String(value ?? '').toLowerCase();

// Total stock across all variants of a product
const getTotalStock = (product) =>
  (product.variants || []).reduce((sum, v) => sum + Number(v.stock ?? 0), 0);

export default function AdminPanel({ 
  backendUrl = 'http://localhost:5000', 
  onProductsUpdated 
}) {
  // Tab State: 'inventory' | 'orders' | 'categories'
  const [activeTab, setActiveTab] = useState('inventory');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Inventory search + status filter ('all' | 'visible' | 'hidden' | 'out')
  const [inventorySearch, setInventorySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Categories state
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryError, setCategoryError] = useState('');
  const [categorySuccessMsg, setCategorySuccessMsg] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

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
    categoryId: '',
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

  // `silent` keeps the table on screen (no "Loading..." flash) so the page doesn't jump
  const fetchProducts = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      // The admin list includes hidden products; the public /products list does not
      const res = await api.get('/products/admin/all');
      setProducts(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      setCategoryError(err.response?.data?.error || err.message || 'Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Helper to sync local state and alert parent container
  const handleDataChange = (silent = false) => {
    fetchProducts(silent);
    fetchCategories(); // product counts per category may have changed
    if (typeof onProductsUpdated === 'function') {
      onProductsUpdated();
    }
  };

  // Products that are out of stock but still visible to customers
  const outOfStockVisible = useMemo(
    () => products.filter((p) => !p.isArchived && getTotalStock(p) <= 0),
    [products]
  );

  // Search + status filter: every word typed must match somewhere in the
  // product's name, category, description, ID, sizes or colors
  const filteredProducts = useMemo(() => {
    const terms = normalize(inventorySearch).trim().split(/\s+/).filter(Boolean);

    return products.filter((p) => {
      if (statusFilter === 'visible' && p.isArchived) return false;
      if (statusFilter === 'hidden' && !p.isArchived) return false;
      if (statusFilter === 'out' && (p.isArchived || getTotalStock(p) > 0)) return false;

      if (terms.length === 0) return true;

      const haystack = [
        p.id,
        `#${p.id}`,
        p.name,
        p.description,
        p.categoryRef?.name || 'uncategorized',
        ...(p.variants || []).map((v) => `${v.size || ''} ${v.color || ''}`)
      ]
        .map(normalize)
        .join(' ');

      return terms.every((term) => haystack.includes(term));
    });
  }, [products, inventorySearch, statusFilter]);

  const filtersActive = inventorySearch.trim() !== '' || statusFilter !== 'all';

  const clearFilters = () => {
    setInventorySearch('');
    setStatusFilter('all');
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
      categoryId: '',
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

    // Expand comma-separated sizes into individual variant objects.
    // Existing variants keep their id, so the server UPDATES them instead of
    // creating a duplicate every time the product is edited.
    const processedVariants = [];

    formData.variants.forEach((v) => {
      if (v.size && v.size.includes(',')) {
        const splitSizes = v.size.split(',').map((s) => s.trim()).filter(Boolean);
        splitSizes.forEach((singleSize, i) => {
          const piece = {
            size: singleSize,
            color: v.color || '',
            stock: Number(v.stock) || 0
          };
          // The existing row's id goes to the first size; the rest are new variants
          if (i === 0 && v.id) piece.id = v.id;
          processedVariants.push(piece);
        });
      } else {
        const piece = {
          size: v.size ? v.size.trim() : '',
          color: v.color || '',
          stock: Number(v.stock) || 0
        };
        if (v.id) piece.id = v.id;
        processedVariants.push(piece);
      }
    });

    const dataToSend = new FormData();
    dataToSend.append('name', formData.name);
    dataToSend.append('description', formData.description);
    dataToSend.append('price', parseFloat(formData.price));
    dataToSend.append('categoryId', formData.categoryId);
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
      categoryId: product.categoryId || '',
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

  // ==========================================
  //        HIDE / SHOW (customer visibility)
  // ==========================================

  const setProductHidden = async (product, hide) => {
    await api.patch(`/products/${product.id}/visibility`, { isArchived: hide });
    // Update the row in place so the table doesn't flash or jump
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isArchived: hide } : p))
    );
  };

  const handleToggleVisibility = async (product) => {
    setError('');
    setSuccessMsg('');
    const hide = !product.isArchived;

    try {
      await setProductHidden(product, hide);
      setSuccessMsg(
        hide
          ? `"${product.name}" is now hidden from customers.`
          : `"${product.name}" is visible to customers again.`
      );
      if (typeof onProductsUpdated === 'function') onProductsUpdated();
    } catch (err) {
      console.error('Visibility change failed:', err.response?.status, err.response?.data || err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Could not change product visibility'
      );
    }
  };

  const handleHideAllOutOfStock = async () => {
    if (outOfStockVisible.length === 0) return;

    const names = outOfStockVisible.map((p) => `• ${p.name}`).join('\n');
    if (!window.confirm(`Hide these ${outOfStockVisible.length} out-of-stock products from customers?\n\n${names}`)) {
      return;
    }

    setError('');
    setSuccessMsg('');

    const results = await Promise.allSettled(
      outOfStockVisible.map((p) => setProductHidden(p, true))
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    const done = results.length - failed;

    if (failed > 0) {
      setError(`Hid ${done} products, but ${failed} could not be hidden. Please try again.`);
    } else {
      setSuccessMsg(`Hid ${done} out-of-stock product${done === 1 ? '' : 's'} from customers.`);
    }
    if (typeof onProductsUpdated === 'function') onProductsUpdated();
  };

  const handleDeleteClick = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) return;

    setError('');
    setSuccessMsg('');

    try {
      await api.delete(`/products/${product.id}`);
      setSuccessMsg(`"${product.name}" deleted successfully`);

      // If the product being deleted is open in the edit form, clear the form
      if (isEditing && editingId === product.id) {
        resetForm();
      }

      handleDataChange(true);
    } catch (err) {
      console.error('Delete product failed:', err.response?.status, err.response?.data || err);

      const serverMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Unknown error';

      // 409 = the product is part of past orders. Offer the safe alternative on the spot.
      if (err.response?.status === 409 || /foreign key|past orders/i.test(serverMessage)) {
        if (product.isArchived) {
          alert(`Could not delete "${product.name}".\n\n${serverMessage}\n\nIt is already hidden from customers.`);
          return;
        }
        const hideInstead = window.confirm(
          `Could not delete "${product.name}".\n\n${serverMessage}\n\nHide it from customers instead?`
        );
        if (hideInstead) {
          handleToggleVisibility(product);
        }
        return;
      }

      setError(serverMessage);
      alert(`Could not delete "${product.name}".\n\n${serverMessage}`);
    }
  };

  // ==========================================
  //           CATEGORY HANDLERS
  // ==========================================

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setCategoryError('');
    setCategorySuccessMsg('');

    if (!newCategoryName.trim()) return;

    try {
      await api.post('/categories', { name: newCategoryName.trim() });
      setCategorySuccessMsg('Category created successfully!');
      setNewCategoryName('');
      fetchCategories();
    } catch (err) {
      setCategoryError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create category');
    }
  };

  const startEditCategory = (category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
    setCategoryError('');
    setCategorySuccessMsg('');
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  const handleRenameCategory = async (id) => {
    if (!editingCategoryName.trim()) return;
    setCategoryError('');
    setCategorySuccessMsg('');

    try {
      await api.put(`/categories/${id}`, { name: editingCategoryName.trim() });
      setCategorySuccessMsg('Category renamed successfully!');
      setEditingCategoryId(null);
      setEditingCategoryName('');
      fetchCategories();
      fetchProducts(true); // product list shows category names, refresh it too
    } catch (err) {
      setCategoryError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to rename category');
    }
  };

  const handleDeleteCategory = async (id, productCount) => {
    if (productCount > 0) {
      alert(`Cannot delete this category — ${productCount} product(s) are still assigned to it. Reassign them first.`);
      return;
    }

    if (!window.confirm('Are you sure you want to delete this category?')) return;

    setCategoryError('');
    setCategorySuccessMsg('');

    try {
      await api.delete(`/categories/${id}`);
      setCategorySuccessMsg('Category deleted successfully');
      fetchCategories();
    } catch (err) {
      setCategoryError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to delete category');
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
          onClick={() => setActiveTab('categories')}
          style={{
            padding: '12px 24px',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            fontSize: '16px',
            fontWeight: activeTab === 'categories' ? 'bold' : 'normal',
            borderBottom: activeTab === 'categories' ? '3px solid #007bff' : '3px solid transparent',
            color: activeTab === 'categories' ? '#007bff' : '#555'
          }}
        >
          📂 Categories
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

      {/* Render Categories Tab */}
      {activeTab === 'categories' && (
        <>
          {categoryError && <div className="admin-alert error">{categoryError}</div>}
          {categorySuccessMsg && <div className="admin-alert success">{categorySuccessMsg}</div>}

          <section className="admin-card">
            <h2>Add New Category</h2>
            <form onSubmit={handleCreateCategory} className="admin-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Accessories"
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Add Category
                </button>
              </div>
            </form>
          </section>

          <section className="admin-card">
            <h2>Existing Categories</h2>
            {categoriesLoading ? (
              <p>Loading categories...</p>
            ) : categories.length === 0 ? (
              <p>No categories yet. Add one above to get started.</p>
            ) : (
              <div className="table-wrapper">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Products</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <tr key={cat.id}>
                        <td>#{cat.id}</td>
                        <td>
                          {editingCategoryId === cat.id ? (
                            <input
                              type="text"
                              value={editingCategoryName}
                              onChange={(e) => setEditingCategoryName(e.target.value)}
                              autoFocus
                            />
                          ) : (
                            <strong>{cat.name}</strong>
                          )}
                        </td>
                        <td>{cat._count?.products ?? 0}</td>
                        <td className="action-cells">
                          {editingCategoryId === cat.id ? (
                            <>
                              <button className="btn-edit" onClick={() => handleRenameCategory(cat.id)}>
                                Save
                              </button>
                              <button className="btn-secondary" onClick={cancelEditCategory}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="btn-edit" onClick={() => startEditCategory(cat)}>
                                Rename
                              </button>
                              <button
                                className="btn-delete"
                                onClick={() => handleDeleteCategory(cat.id, cat._count?.products ?? 0)}
                              >
                                Delete
                              </button>
                            </>
                          )}
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
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {categories.length === 0 && !categoriesLoading && (
                    <small style={{ color: '#b36b00' }}>
                      No categories yet — create one in the Categories tab first.
                    </small>
                  )}
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
            <div style={listStyles.headerRow}>
              <h2 style={{ margin: 0 }}>Existing Inventory</h2>

              <div style={listStyles.controls}>
                <div style={listStyles.searchWrap}>
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setInventorySearch('');
                    }}
                    placeholder="Search by name, category, size, or #ID..."
                    aria-label="Search products"
                    style={listStyles.searchInput}
                  />
                  {inventorySearch && (
                    <button
                      type="button"
                      onClick={() => setInventorySearch('')}
                      aria-label="Clear search"
                      title="Clear search"
                      style={listStyles.clearBtn}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by visibility"
                  style={listStyles.select}
                >
                  <option value="all">All products</option>
                  <option value="visible">Visible to customers</option>
                  <option value="hidden">Hidden from customers</option>
                  <option value="out">Out of stock (still visible)</option>
                </select>
              </div>
            </div>

            {/* Nudge: out-of-stock products customers can still see */}
            {!loading && outOfStockVisible.length > 0 && (
              <div style={listStyles.nudge}>
                <span>
                  <strong>{outOfStockVisible.length}</strong> out-of-stock product
                  {outOfStockVisible.length === 1 ? ' is' : 's are'} still visible to customers.
                </span>
                <span style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('out')}
                    style={listStyles.nudgeSecondaryBtn}
                  >
                    Show them
                  </button>
                  <button
                    type="button"
                    onClick={handleHideAllOutOfStock}
                    style={listStyles.nudgeBtn}
                  >
                    Hide all out-of-stock
                  </button>
                </span>
              </div>
            )}

            {!loading && products.length > 0 && (
              <p style={listStyles.countText}>
                {filtersActive
                  ? `Showing ${filteredProducts.length} of ${products.length} products`
                  : `${products.length} products`}
              </p>
            )}

            {loading ? (
              <p>Loading inventory...</p>
            ) : products.length === 0 ? (
              <p>No products found in the catalog.</p>
            ) : filteredProducts.length === 0 ? (
              <p>
                No products match your search or filter.{' '}
                <button
                  type="button"
                  onClick={clearFilters}
                  style={listStyles.linkBtn}
                >
                  Clear filters
                </button>
              </p>
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
                    {filteredProducts.map((prod) => {
                      const totalStock = getTotalStock(prod);
                      const isOut = totalStock <= 0;

                      return (
                        <tr key={prod.id} style={prod.isArchived ? { opacity: 0.55 } : undefined}>
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
                          <td>
                            <strong>{prod.name}</strong>
                            <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {prod.isArchived && <span style={listStyles.badgeHidden}>Hidden</span>}
                              {isOut && <span style={listStyles.badgeOut}>Out of stock</span>}
                            </div>
                          </td>
                          <td>{prod.categoryRef?.name || <em>Uncategorized</em>}</td>
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
                              className={prod.isArchived ? 'btn-edit' : 'btn-secondary'}
                              style={isOut && !prod.isArchived ? listStyles.hideNowBtn : undefined}
                              onClick={() => handleToggleVisibility(prod)}
                              title={
                                prod.isArchived
                                  ? 'Show this product to customers again'
                                  : 'Hide this product from customers'
                              }
                            >
                              {prod.isArchived ? 'Show' : 'Hide'}
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteClick(prod)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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

// Inline styles for the inventory list controls (no CSS file changes needed)
const listStyles = {
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '8px'
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    flex: '1 1 320px',
    justifyContent: 'flex-end'
  },
  searchWrap: {
    position: 'relative',
    flex: '1 1 240px',
    maxWidth: '380px'
  },
  searchInput: {
    width: '100%',
    padding: '10px 34px 10px 12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  clearBtn: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#888',
    fontSize: '13px',
    padding: '4px'
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '13px',
    backgroundColor: '#fff',
    cursor: 'pointer'
  },
  nudge: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    padding: '10px 14px',
    marginBottom: '12px',
    backgroundColor: '#fff4e5',
    border: '1px solid #f5d9a8',
    borderRadius: '6px',
    color: '#8a5a00',
    fontSize: '13px'
  },
  nudgeBtn: {
    padding: '6px 12px',
    backgroundColor: '#b36b00',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  nudgeSecondaryBtn: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    color: '#8a5a00',
    border: '1px solid #b36b00',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  countText: {
    margin: '0 0 12px 0',
    fontSize: '12px',
    color: '#777'
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    color: '#007bff',
    textDecoration: 'underline',
    cursor: 'pointer',
    font: 'inherit'
  },
  badgeHidden: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    backgroundColor: '#e8e8e8',
    color: '#555',
    fontSize: '10px',
    fontWeight: 700
  },
  badgeOut: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    backgroundColor: '#fce8e6',
    color: '#c5221f',
    fontSize: '10px',
    fontWeight: 700
  },
  hideNowBtn: {
    backgroundColor: '#b36b00',
    color: '#fff',
    border: 'none'
  }
};