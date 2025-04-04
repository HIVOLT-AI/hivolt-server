import {
  Chain,
  TokenAddress,
  UniversalAddress,
  TransactionId,
} from '@wormhole-foundation/sdk';

export type CreateWrappedTokenResponse = {
  success: boolean;
  wrappedToken?: {
    chain: Chain;
    address: string | TokenAddress<Chain> | UniversalAddress;
  };
  attestationTxid?: string;
  error?: string;
};

export type TransferTokenResponse = {
  success: boolean;
  srcTxIds: string[];
  dstTxIds: string[];
  transferId: TransactionId;
  error?: string;
};
