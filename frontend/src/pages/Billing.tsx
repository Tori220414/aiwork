import React, { useState, useEffect } from 'react';
import { CreditCard, Check, AlertCircle, Loader } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface SubscriptionStatus {
  status: string;
  trial_end_date: string;
  trial_days_left: number;
  is_trial: boolean;
  is_active: boolean;
}

const Billing: React.FC = () => {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await api.get('/subscription/status');
      setSubscription(response.data);
    } catch (error: any) {
      toast.error('Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setCheckoutLoading(true);
    try {
      const response = await api.post('/subscription/create-checkout');
      window.location.href = response.data.url;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create checkout');
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setCheckoutLoading(true);
    try {
      const response = await api.post('/subscription/create-portal');
      window.location.href = response.data.url;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to open billing portal');
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Billing & Subscription</h1>
          <p className="text-lg text-gray-600">Manage your Aurora Tasks subscription</p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Current Plan</h2>
            {subscription?.is_active && (
              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Active
              </span>
            )}
          </div>

          {subscription?.is_trial ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-start space-x-4">
                <AlertCircle className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Free Trial Active</h3>
                  <p className="text-blue-700 mb-2">
                    You have <strong>{subscription.trial_days_left} days</strong> left in your free trial.
                  </p>
                  <p className="text-sm text-blue-600">
                    Trial ends: {new Date(subscription.trial_end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-start space-x-4">
                <Check className="w-6 h-6 text-green-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">Aurora Tasks Pro</h3>
                  <p className="text-green-700">$10.99/month</p>
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            {subscription?.status === 'active' ? (
              <button
                onClick={handleManageSubscription}
                disabled={checkoutLoading}
                className="btn btn-secondary w-full sm:w-auto"
              >
                {checkoutLoading ? (
                  <Loader className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <CreditCard className="w-5 h-5 mr-2" />
                )}
                Manage Subscription
              </button>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={checkoutLoading}
                className="btn btn-primary w-full sm:w-auto"
              >
                {checkoutLoading ? (
                  <Loader className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <CreditCard className="w-5 h-5 mr-2" />
                )}
                Subscribe Now
              </button>
            )}
          </div>
        </div>

        {/* Pricing Card */}
        <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Aurora Tasks Pro</h2>

          <div className="mb-8">
            <div className="flex items-baseline mb-2">
              <span className="text-5xl font-bold text-gray-900">$10.99</span>
              <span className="text-xl text-gray-600 ml-2">/month</span>
            </div>
            <p className="text-primary-600 font-medium">30-day free trial • Cancel anytime</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">AI-powered task extraction from emails and notes</span>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Intelligent task prioritization</span>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Automated daily planning</span>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Productivity analytics & insights</span>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Meeting preparation & notes</span>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Unlimited workspaces & boards</span>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-700">Calendar & timeline views</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
