import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import calendarService from '../services/calendarService';
import toast from 'react-hot-toast';

const OutlookCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Connecting to Outlook...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code from URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Check for errors from Microsoft
        if (error) {
          console.error('OAuth error:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || 'Authorization failed. Please try again.');
          toast.error(errorDescription || 'Failed to connect Outlook');

          // Redirect to calendar page after 3 seconds
          setTimeout(() => {
            navigate('/calendar');
          }, 3000);
          return;
        }

        // Check if we have the authorization code
        if (!code) {
          setStatus('error');
          setMessage('No authorization code received. Please try again.');
          toast.error('No authorization code received');

          setTimeout(() => {
            navigate('/calendar');
          }, 3000);
          return;
        }

        // Exchange code for tokens
        setMessage('Connecting to Outlook calendar...');
        const response = await calendarService.connectOutlook(code);

        if (response.success) {
          setStatus('success');
          setMessage(`Successfully connected to ${response.email}`);
          toast.success('Outlook calendar connected!');

          // Redirect to calendar page after 2 seconds
          setTimeout(() => {
            navigate('/calendar');
          }, 2000);
        } else {
          throw new Error('Failed to connect calendar');
        }
      } catch (error: any) {
        console.error('Callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to connect Outlook calendar');
        toast.error(error.message || 'Connection failed');

        // Redirect to calendar page after 3 seconds
        setTimeout(() => {
          navigate('/calendar');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <div className="mb-4 flex justify-center">
                <RefreshCw className="w-16 h-16 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Connecting...
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Success!
              </h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500 mt-4">
                Redirecting to calendar settings...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Connection Failed
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <button
                onClick={() => navigate('/calendar')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Calendar Settings
              </button>
            </>
          )}
        </div>

        {status === 'processing' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Please wait while we connect to your Outlook calendar.
              This may take a few moments.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutlookCallback;
