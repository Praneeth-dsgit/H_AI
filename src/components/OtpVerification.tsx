import React, { useState } from 'react';

const OtpVerification: React.FC<{ email: string; onVerified: () => void }> = ({ email, onVerified }) => {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('http://localhost:5000/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('OTP verified! You can now log in.');
        onVerified();
      } else {
        setMessage(data.error || 'OTP verification failed.');
      }
    } catch (err) {
      setMessage('OTP verification failed.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto p-4 border rounded">
      <h2 className="text-xl mb-4">Verify OTP</h2>
      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={e => setOtp(e.target.value)}
        className="block w-full mb-2 p-2 border rounded"
        required
      />
      <button type="submit" className="w-full bg-green-500 text-white p-2 rounded" disabled={loading}>
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>
      {message && <div className="mt-2 text-center text-red-500">{message}</div>}
    </form>
  );
};

export default OtpVerification; 