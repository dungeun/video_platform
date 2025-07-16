import React, { useState } from 'react';
import { SubscriptionPlanProps, CreateSubscriptionRequest, DeliverySchedule } from '../types';

export const SubscriptionPlan: React.FC<SubscriptionPlanProps> = ({
  plan,
  products,
  onSubscribe,
  isLoading = false,
  className = ''
}) => {
  const [selectedProducts, setSelectedProducts] = useState<{[key: string]: number}>({});
  const [deliveryFrequency, setDeliveryFrequency] = useState(plan.billingFrequency);
  const [showForm, setShowForm] = useState(false);

  const handleProductSelection = (productId: string, quantity: number) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: quantity
    }));
  };

  const handleSubscribe = () => {
    const items = Object.entries(selectedProducts)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (items.length === 0) {
      alert('Please select at least one product');
      return;
    }

    const request: CreateSubscriptionRequest = {
      userId: 'current-user', // This would come from auth context
      planId: plan.id,
      items,
      deliveryAddress: {
        name: 'John Doe',
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'US'
      },
      paymentMethodId: 'default-payment',
      deliverySchedule: {
        frequency: deliveryFrequency,
        skipHolidays: true,
        skipWeekends: false
      }
    };

    onSubscribe(request);
  };

  const calculateTotal = () => {
    return Object.entries(selectedProducts).reduce((total, [productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      if (product) {
        const discountedPrice = product.price * (1 - plan.discountPercentage / 100);
        return total + (discountedPrice * quantity);
      }
      return total;
    }, 0);
  };

  return (
    <div className={`subscription-plan ${className}`}>
      <div className="plan-header">
        <h3 className="plan-name">{plan.name}</h3>
        <p className="plan-description">{plan.description}</p>
        <div className="plan-discount">
          <span className="discount-badge">{plan.discountPercentage}% OFF</span>
          <span className="billing-frequency">Billed {plan.billingFrequency}</span>
        </div>
      </div>

      <div className="plan-features">
        <h4>Plan Features:</h4>
        <ul>
          {plan.features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>

      {!showForm ? (
        <button 
          className="get-started-btn"
          onClick={() => setShowForm(true)}
          disabled={!plan.isActive}
        >
          Get Started
        </button>
      ) : (
        <div className="subscription-form">
          <h4>Select Products:</h4>
          <div className="product-selection">
            {products.filter(p => p.isSubscriptionEligible).map(product => (
              <div key={product.id} className="product-item">
                <div className="product-info">
                  <img src={product.imageUrl} alt={product.name} className="product-image" />
                  <div>
                    <h5>{product.name}</h5>
                    <p className="product-price">
                      ${(product.price * (1 - plan.discountPercentage / 100)).toFixed(2)}
                      <span className="original-price">${product.price.toFixed(2)}</span>
                    </p>
                  </div>
                </div>
                <div className="quantity-selector">
                  <button 
                    onClick={() => handleProductSelection(product.id, Math.max(0, (selectedProducts[product.id] || 0) - 1))}
                  >
                    -
                  </button>
                  <span>{selectedProducts[product.id] || 0}</span>
                  <button 
                    onClick={() => handleProductSelection(product.id, (selectedProducts[product.id] || 0) + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="delivery-options">
            <h4>Delivery Frequency:</h4>
            <select 
              value={deliveryFrequency} 
              onChange={(e) => setDeliveryFrequency(e.target.value as any)}
            >
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>

          <div className="order-summary">
            <h4>Order Summary:</h4>
            <div className="total-amount">
              Total: ${calculateTotal().toFixed(2)} per {deliveryFrequency}
            </div>
          </div>

          <div className="form-actions">
            <button 
              className="subscribe-btn"
              onClick={handleSubscribe}
              disabled={isLoading || Object.values(selectedProducts).every(q => q === 0)}
            >
              {isLoading ? 'Processing...' : 'Subscribe Now'}
            </button>
            <button 
              className="cancel-btn"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// CSS styles would be in a separate file
const styles = `
.subscription-plan {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
  background: white;
}

.plan-header {
  text-align: center;
  margin-bottom: 1rem;
}

.plan-name {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.plan-description {
  color: #666;
  margin: 0 0 1rem 0;
}

.plan-discount {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.discount-badge {
  background: #e74c3c;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: 600;
}

.billing-frequency {
  color: #666;
  font-size: 0.875rem;
}

.plan-features ul {
  list-style: none;
  padding: 0;
}

.plan-features li {
  padding: 0.25rem 0;
  position: relative;
  padding-left: 1.5rem;
}

.plan-features li:before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #27ae60;
  font-weight: bold;
}

.get-started-btn {
  width: 100%;
  background: #3498db;
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.get-started-btn:hover {
  background: #2980b9;
}

.get-started-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.subscription-form {
  margin-top: 1rem;
}

.product-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 4px;
  margin: 0.5rem 0;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.product-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.product-price {
  font-weight: 600;
  color: #e74c3c;
}

.original-price {
  text-decoration: line-through;
  color: #999;
  margin-left: 0.5rem;
  font-weight: normal;
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quantity-selector button {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.quantity-selector button:hover {
  background: #f5f5f5;
}

.delivery-options, .order-summary {
  margin: 1rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.delivery-options select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.total-amount {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.subscribe-btn, .cancel-btn {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.subscribe-btn {
  background: #27ae60;
  color: white;
}

.subscribe-btn:hover {
  background: #229954;
}

.subscribe-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.cancel-btn {
  background: #95a5a6;
  color: white;
}

.cancel-btn:hover {
  background: #7f8c8d;
}
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('subscription-plan-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'subscription-plan-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}