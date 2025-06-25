import { useCallback, useMemo } from 'react';
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useReadContracts,
  useWatchContractEvent
} from 'wagmi';
import { parseEther, formatEther } from 'viem';
import celoKudosAbi from '../abi/CeloKudos.json';

// Contract address - you'll need to replace this with your deployed contract address
const CELO_KUDOS_CONTRACT_ADDRESS = '0x8f15a99c6D6Ac062782fE7489FE57Ecd2e236042'; // Replace with actual address

// Types
export interface Kudos {
  sender: string;
  recipient: string;
  amount: bigint;
  message: string;
  timestamp: bigint;
  isPublic: boolean;
}

export interface UserStats {
  receivedCount: bigint;
  sentCount: bigint;
  totalReceived: bigint;
  totalSent: bigint;
}

export interface PlatformStats {
  totalKudos: bigint;
  totalAmount: bigint;
  userCount: bigint;
}

export interface SendKudosParams {
  recipient: string;
  amount: string; // in cUSD (will be converted to wei)
  message: string;
  isPublic: boolean;
}

export function useCeloKudos() {
  const { address, isConnected } = useAccount();

  // Contract configuration
  const contractConfig = useMemo(() => ({
    address: CELO_KUDOS_CONTRACT_ADDRESS as `0x${string}`,
    abi: celoKudosAbi.abi,
  }), []);

  // Write contract hook
  const { 
    data: writeData, 
    writeContract, 
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite
  } = useWriteContract();

  // Wait for transaction receipt
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: confirmError 
  } = useWaitForTransactionReceipt({
    hash: writeData,
  });

  // Read contract functions
  const { data: totalKudos } = useReadContract({
    ...contractConfig,
    functionName: 'getTotalKudos',
  });

  const { data: platformStats } = useReadContract({
    ...contractConfig,
    functionName: 'getPlatformStats',
  });

  const { data: userStats } = useReadContract({
    ...contractConfig,
    functionName: 'getUserStats',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Send kudos function
  const sendKudos = useCallback(async (params: SendKudosParams) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    const { recipient, amount, message, isPublic } = params;
    
    // Validate inputs
    if (!recipient || !amount || !message) {
      throw new Error('Missing required parameters');
    }

    if (recipient === address) {
      throw new Error('Cannot send kudos to yourself');
    }

    // Convert amount to wei
    const amountInWei = parseEther(amount);

    try {
      await writeContract({
        ...contractConfig,
        functionName: 'sendKudos',
        args: [recipient, amountInWei, message, isPublic],
      });
    } catch (error) {
      console.error('Error sending kudos:', error);
      throw error;
    }
  }, [isConnected, address, writeContract, contractConfig]);

  // Get kudos by ID
  const getKudosById = useCallback((kudosId: bigint) => {
    return useReadContract({
      ...contractConfig,
      functionName: 'getKudosById',
      args: [kudosId],
    });
  }, [contractConfig]);

  // Get kudos received by user
  const getKudosReceived = useCallback((userAddress: string, offset: bigint = 0n, limit: bigint = 10n) => {
    return useReadContract({
      ...contractConfig,
      functionName: 'getKudosReceived',
      args: [userAddress, offset, limit],
    });
  }, [contractConfig]);

  // Get kudos sent by user
  const getKudosSent = useCallback((userAddress: string, offset: bigint = 0n, limit: bigint = 10n) => {
    return useReadContract({
      ...contractConfig,
      functionName: 'getKudosSent',
      args: [userAddress, offset, limit],
    });
  }, [contractConfig]);

  // Get public kudos
  const getPublicKudos = useCallback((offset: bigint = 0n, limit: bigint = 10n) => {
    return useReadContract({
      ...contractConfig,
      functionName: 'getPublicKudos',
      args: [offset, limit],
    });
  }, [contractConfig]);

  // Watch for KudosSent events
  useWatchContractEvent({
    ...contractConfig,
    eventName: 'KudosSent',
    onLogs: (logs) => {
      console.log('Kudos sent:', logs);
    },
  });

  // Watch for KudosReceived events
  useWatchContractEvent({
    ...contractConfig,
    eventName: 'KudosReceived',
    onLogs: (logs) => {
      console.log('Kudos received:', logs);
    },
  });

  // Utility functions
  const formatAmount = useCallback((amount: bigint) => {
    return formatEther(amount);
  }, []);

  const formatTimestamp = useCallback((timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  }, []);

  // Batch read multiple kudos
  const useBatchKudos = useCallback((kudosIds: bigint[]) => {
    const contracts = kudosIds.map(id => ({
      ...contractConfig,
      functionName: 'getKudosById' as const,
      args: [id] as const,
    }));

    return useReadContracts({ 
      contracts: contracts as any 
    });
  }, [contractConfig]);

  // Get user's recent kudos (both sent and received)
  const useUserRecentKudos = useCallback((userAddress: string, limit: bigint = 5n) => {
    const sentKudos = getKudosSent(userAddress, 0n, limit);
    const receivedKudos = getKudosReceived(userAddress, 0n, limit);
    
    return {
      sentKudos,
      receivedKudos,
      isLoading: sentKudos.isLoading || receivedKudos.isLoading,
      error: sentKudos.error || receivedKudos.error,
    };
  }, [getKudosSent, getKudosReceived]);

  return {
    // Contract info
    contractAddress: CELO_KUDOS_CONTRACT_ADDRESS,
    isConnected,
    address,

    // Write functions
    sendKudos,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
    confirmError,
    resetWrite,

    // Read functions
    totalKudos,
    platformStats: platformStats as PlatformStats | undefined,
    userStats: userStats as UserStats | undefined,
    getKudosById,
    getKudosReceived,
    getKudosSent,
    getPublicKudos,

    // Events - removed data properties since useWatchContractEvent doesn't return them
    kudosSentEvents: undefined,
    kudosReceivedEvents: undefined,

    // Utility functions
    formatAmount,
    formatTimestamp,
    useBatchKudos,
    useUserRecentKudos,

    // Helper functions for common operations
    getKudosReceivedForCurrentUser: useCallback((offset: bigint = 0n, limit: bigint = 10n) => {
      return address ? getKudosReceived(address, offset, limit) : null;
    }, [address, getKudosReceived]),

    getKudosSentByCurrentUser: useCallback((offset: bigint = 0n, limit: bigint = 10n) => {
      return address ? getKudosSent(address, offset, limit) : null;
    }, [address, getKudosSent]),

    // Check if user can send kudos (basic validation)
    canSendKudos: useCallback((amount: string) => {
      if (!isConnected || !address) return false;
      try {
        parseEther(amount);
        return true;
      } catch {
        return false;
      }
    }, [isConnected, address]),
  };
}

// Hook for getting a specific kudos by ID
export function useKudosById(kudosId: bigint) {
  const { contractAddress } = useCeloKudos();
  
  const { data: kudos, isLoading, error } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: celoKudosAbi.abi,
    functionName: 'getKudosById',
    args: [kudosId],
  });

  return {
    kudos: kudos as Kudos | undefined,
    isLoading,
    error,
  };
}

// Hook for getting user's kudos with pagination
export function useUserKudos(userAddress: string, type: 'sent' | 'received', page: number = 0, limit: number = 10) {
  const { contractAddress } = useCeloKudos();
  
  const { data: kudosIds, isLoading, error } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: celoKudosAbi.abi,
    functionName: type === 'sent' ? 'getKudosSent' : 'getKudosReceived',
    args: [userAddress, BigInt(page * limit), BigInt(limit)],
  });

  // Get the actual kudos data for the IDs
  const { data: kudosData } = useReadContracts({
    contracts: (kudosIds as bigint[] || []).map(id => ({
      address: contractAddress as `0x${string}`,
      abi: celoKudosAbi.abi,
      functionName: 'getKudosById',
      args: [id],
    })) as any,
  });

  return {
    kudosIds: kudosIds as bigint[] | undefined,
    kudos: kudosData as Kudos[] | undefined,
    isLoading,
    error,
  };
}

// Hook for getting public kudos feed
export function usePublicKudosFeed(page: number = 0, limit: number = 10) {
  const { contractAddress } = useCeloKudos();
  
  const { data: kudosIds, isLoading, error } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: celoKudosAbi.abi,
    functionName: 'getPublicKudos',
    args: [BigInt(page * limit), BigInt(limit)],
  });

  // Get the actual kudos data for the IDs
  const { data: kudosData } = useReadContracts({
    contracts: (kudosIds as bigint[] || []).map(id => ({
      address: contractAddress as `0x${string}`,
      abi: celoKudosAbi.abi,
      functionName: 'getKudosById',
      args: [id],
    })) as any,
  });

  return {
    kudosIds: kudosIds as bigint[] | undefined,
    kudos: kudosData as Kudos[] | undefined,
    isLoading,
    error,
  };
} 