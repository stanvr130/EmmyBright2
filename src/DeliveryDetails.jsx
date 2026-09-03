import React, { useState, useEffect } from 'react';

function DeliveryDetails({ initialData, onDeliveryChange, styles = {} }) {
  // Standard dispatch rate fixed at 3000
  const deliveryRates = {
    standard: 3000
  };

  const deliveryType = 'standard';

  // Lazy initialize state: check initialData first, then localStorage, then fallback to empty strings
  const [shippingDetails, setShippingDetails] = useState(() => {
    const savedLocal = localStorage.getItem('eb_deliveryDetails');
    const parsedLocal = savedLocal ? JSON.parse(savedLocal) : null;

    return {
      fullName: initialData?.addressDetails?.fullName || parsedLocal?.fullName || '',
      phoneNumber: initialData?.addressDetails?.phoneNumber || parsedLocal?.phoneNumber || '',
      deliveryAddress: initialData?.addressDetails?.deliveryAddress || parsedLocal?.deliveryAddress || '',
      stateRegion: initialData?.addressDetails?.stateRegion || parsedLocal?.stateRegion || '',
      additionalNotes: initialData?.addressDetails?.additionalNotes || parsedLocal?.additionalNotes || ''
    };
  });
  
  const [formErrors, setFormErrors] = useState({});

  const validateForm = (setShowErrors = true) => {
    const errors = {};
    if (!shippingDetails.fullName.trim()) errors.fullName = 'Required';
    if (!shippingDetails.phoneNumber.trim()) errors.phoneNumber = 'Required';
    if (!shippingDetails.deliveryAddress.trim()) errors.deliveryAddress = 'Required';
    if (!shippingDetails.stateRegion.trim()) errors.stateRegion = 'Required';

    if (setShowErrors) {
      setFormErrors(errors);
    }
    return Object.keys(errors).length === 0;
  };

  // Broadcast state to parent AND persist to localStorage on change
  useEffect(() => {
    localStorage.setItem('eb_deliveryDetails', JSON.stringify(shippingDetails));

    onDeliveryChange({
      type: deliveryType,
      fee: deliveryRates[deliveryType],
      addressDetails: shippingDetails,
      isValid: validateForm(false) 
    });
  }, [shippingDetails]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingDetails(prev => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const localStyles = {
    container: {
      backgroundColor: '#ffffff',
      padding: '14px',
      borderRadius: '6px',
      border: '1px solid #e2e8f0',
      marginTop: '20px',
      width: '100%',
      boxSizing: 'border-box',
      textAlign: 'left',
      ...styles.deliveryContainer
    },
    heading: {
      fontSize: '12px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '10px',
      borderBottom: '1px solid #edf2f7',
      paddingBottom: '4px',
      color: '#1a1a1a',
      textAlign: 'left',
      width: '100%'
    },
    row: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: '10px',
      marginBottom: '10px'
    },
    formGroup: {
      flex: '1 1 140px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      textAlign: 'left'
    },
    fullWidthGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      marginBottom: '10px',
      width: '100%',
      textAlign: 'left'
    },
    label: {
      fontSize: '11px',
      fontWeight: '600',
      color: '#4a5568',
      textAlign: 'left',
      display: 'block'
    },
    input: {
      padding: '7px 10px',
      fontSize: '12px',
      borderRadius: '4px',
      border: '1px solid #cbd5e0',
      outline: 'none',
      boxSizing: 'border-box',
      width: '100%',
      backgroundColor: '#f7fafc'
    },
    inputError: {
      borderColor: '#e53e3e',
      backgroundColor: '#fff5f5'
    },
    errorText: {
      color: '#e53e3e',
      fontSize: '10px',
      fontWeight: '500',
      marginTop: '1px',
      textAlign: 'left'
    },
    radioCardGroup: {
      display: 'flex',
      flexDirection: 'row',
      gap: '8px',
      marginBottom: '14px'
    },
    radioCard: {
      flex: '1 1 0',
      border: '1px solid #1a1a1a',
      borderRadius: '4px',
      padding: '8px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      backgroundColor: '#f8fafc',
      boxShadow: '0 0 0 1px #1a1a1a',
      textAlign: 'left'
    },
    radioTop: {
      display: 'flex',
      justify: 'space-between',
      alignItems: 'center',
      fontWeight: '700',
      fontSize: '12px',
      color: '#1a1a1a'
    },
    radioSub: {
      fontSize: '10px',
      color: '#718096',
      lineHeight: '1.2'
    }
  };

  return (
    <div style={localStyles.container}>
      <h2 style={localStyles.heading}>1. Delivery Arrangement</h2>
      
      <div style={localStyles.radioCardGroup}>
        <div style={localStyles.radioCard}>
          <div style={localStyles.radioTop}>
            <span>Standard Dispatch </span>
            <span>₦{deliveryRates.standard.toLocaleString()}</span>
          </div>
          <div style={localStyles.radioSub}>Takes 1 to 2 business delivery days.</div>
        </div>
      </div>

      <h2 style={localStyles.heading}>2. Destination Address Record</h2>

      <div style={localStyles.row}>
        <div style={localStyles.formGroup}>
          <label style={localStyles.label}>Recipient Full Name *</label>
          <input 
            type="text"
            name="fullName"
            placeholder="John Doe"
            value={shippingDetails.fullName}
            onChange={handleInputChange}
            style={{
              ...localStyles.input,
              ...(formErrors.fullName ? localStyles.inputError : {})
            }}
          />
          {formErrors.fullName && <span style={localStyles.errorText}>{formErrors.fullName}</span>}
        </div>

        <div style={localStyles.formGroup}>
          <label style={localStyles.label}>Active Phone Line *</label>
          <input 
            type="tel"
            name="phoneNumber"
            placeholder="+234..."
            value={shippingDetails.phoneNumber}
            onChange={handleInputChange}
            style={{
              ...localStyles.input,
              ...(formErrors.phoneNumber ? localStyles.inputError : {})
            }}
          />
          {formErrors.phoneNumber && <span style={localStyles.errorText}>{formErrors.phoneNumber}</span>}
        </div>
      </div>

      <div style={localStyles.row}>
        <div style={{...localStyles.formGroup, flex: '2 1 200px'}}>
          <label style={localStyles.label}>Street Address *</label>
          <input 
            type="text"
            name="deliveryAddress"
            placeholder="House Number, Street Name"
            value={shippingDetails.deliveryAddress}
            onChange={handleInputChange}
            style={{
              ...localStyles.input,
              ...(formErrors.deliveryAddress ? localStyles.inputError : {})
            }}
          />
          {formErrors.deliveryAddress && <span style={localStyles.errorText}>{formErrors.deliveryAddress}</span>}
        </div>

        <div style={localStyles.formGroup}>
          <label style={localStyles.label}>State / Region *</label>
          <input 
            type="text"
            name="stateRegion"
            placeholder="e.g. Lagos, Oyo"
            value={shippingDetails.stateRegion}
            onChange={handleInputChange}
            style={{
              ...localStyles.input,
              ...(formErrors.stateRegion ? localStyles.inputError : {})
            }}
          />
          {formErrors.stateRegion && <span style={localStyles.errorText}>{formErrors.stateRegion}</span>}
        </div>
      </div>

      <div style={localStyles.fullWidthGroup}>
        <label style={localStyles.label}>Delivery Instructions (Optional)</label>
        <input 
          type="text"
          name="additionalNotes"
          placeholder="Landmarks, timing updates..."
          value={shippingDetails.additionalNotes}
          onChange={handleInputChange}
          style={localStyles.input}
        />
      </div>
    </div>
  );
}

export default DeliveryDetails;