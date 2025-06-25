'use client';

import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import abi from '../abi/CeloKudos.json';

const CELO_KUDOS_CONTRACT = '0x0000000000000000000000000000000000000000' as `0x${string}`;

export default function KudosForm() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const { writeContractAsync } = useWriteContract();

  const sendKudos = async () => {
    setStatus('⏳ Sending...');
    try {
      await writeContractAsync({
        address: CELO_KUDOS_CONTRACT,
        abi,
        functionName: 'sendKudos',
        args: [recipient, parseUnits(amount, 18), message],
      });
      setStatus('✅ Kudos sent!');
    } catch (error) {
      console.error(error);
      setStatus('❌ Failed to send kudos');
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
      <button
        onClick={sendKudos}
        className="w-full p-2 bg-green-600 text-white rounded"
      >
        Send Kudos 🚀
      </button>
      {status && <p className="text-center text-sm">{status}</p>}
    </div>
  );
}
