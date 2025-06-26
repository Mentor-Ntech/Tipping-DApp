'use client';

import { useState } from 'react';
import { useCeloKudos } from '../hooks/useCeloKudos';

export default function KudosForm() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [status, setStatus] = useState('');

  const {
    sendKudos,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
    resetWrite,
    isConnected,
    address
  } = useCeloKudos();

  const handleSendKudos = async () => {
    console.log('Sending kudos with:', { recipient, amount, message, isPublic });
    console.log('Wallet connection state:', { isConnected, address });
    setStatus('⏳ Sending...');
    try {
      await sendKudos({
        recipient,
        amount,
        message,
        isPublic,
      });
      setStatus('✅ Kudos sent!');
    } catch (error: any) {
      setStatus('❌ Failed to send kudos: ' + (error?.message || 'Unknown error'));
    }
  };

  return (
    <div className="mt-6 w-full max-w-md space-y-4 bg-white p-4 rounded-xl shadow">
      <input
        type="text"
        placeholder="Recipient Address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="number"
        placeholder="Amount (cUSD)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={() => setIsPublic((v) => !v)}
        />
        <span>Public Kudos</span>
      </label>
      <button
        onClick={handleSendKudos}
        className="w-full p-2 bg-green-600 text-white rounded"
        disabled={isWritePending || isConfirming}
      >
        {isWritePending || isConfirming ? 'Sending...' : 'Send Kudos 🚀'}
      </button>
      {status && <p className="text-center text-sm">{status}</p>}
      {writeError && <p className="text-center text-xs text-red-500">{writeError.message}</p>}
    </div>
  );
}
