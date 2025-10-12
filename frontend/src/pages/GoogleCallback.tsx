import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { calendarService } from '../services/calendarService';
import { toast } from 'react-hot-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const GoogleCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting to Google Calendar...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage('Google Calendar connection was cancelled or denied.');
        toast.error('Failed to connect Google Calendar');
        setTimeout(() => navigate('/settings'), 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received from Google.');
        toast.error('Invalid callback from Google');
        setTimeout(() => navigate('/settings'), 3000);
        return;
      }

      try {
        const response = await calendarService.connectGoogle(code);

        if (response.success) {
          setStatus('success');
          setMessage('Successfully connected to Google Calendar!');
          toast.success('Google Calendar connected successfully!');
          setTimeout(() => navigate('/settings'), 2000);
        } else {
          throw new Error(response.message || 'Failed to connect');
        }
      } catch (error: any) {
        console.error('Google Calendar connection error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to connect to Google Calendar');
        toast.error(error.message || 'Failed to connect Google Calendar');
        setTimeout(() => navigate('/settings'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connecting...</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500 mt-2">Redirecting to settings...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Failed</h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500 mt-2">Redirecting to settings...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleCallback;
