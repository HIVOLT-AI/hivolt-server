import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { AgentConfig } from 'src/shared/types/agent';
import { sanctum_add_liquidity } from 'src/agent/sanctum/addLiquidity';
import { sanctum_remove_liquidity } from 'src/agent/sanctum/removeLiquidity';
import { sanctum_get_apy } from 'src/agent/sanctum/getAPY';
import { sanctum_get_price } from 'src/agent/sanctum/getPrice';
import { sanctum_get_tvl } from 'src/agent/sanctum/getTVL';
import { sanctum_lst_swap } from 'src/agent/sanctum/swapLst';
import { wormhole_transfer_token } from 'src/agent/wormhole/transferToken';
import { TokenId, Chain } from '@wormhole-foundation/sdk';
import { NetworkType } from 'src/shared/types/chain';
import { wormhole_create_wrapped_token } from 'src/agent/wormhole/createWrappedToken';
import { solana_get_token_balance } from 'src/agent/solana/getTokenBalance';
import { solana_get_owned_token } from 'src/agent/solana/getOwnedToken';
import { solana_transfer_token } from 'src/agent/solana/tokenTransfer';
import { solana_transfer } from 'src/agent/solana/transfer';
import { solayer_get_info } from 'src/agent/solayer/getInfo';
import { solayer_stake_sol } from 'src/agent/solayer/stakeWithSolayer';
import { solana_get_balance } from 'src/agent/solana/getBalance';
import { lulo_get_account } from 'src/agent/lulo/getAccount';
import { lulo_deposit } from 'src/agent/lulo/deposit';
import { lulo_withdraw_protected } from 'src/agent/lulo/withdrawProtected';
import { lulo_initiate_withdrawal_boosted_only } from 'src/agent/lulo/initiateWithdrawalBoostedOnly';
import { lulo_complete_withdrawal_boosted_only } from 'src/agent/lulo/completeWithdrawalBoostedOnly';
import { lulo_list_pending_withdrawals_boosted_only } from 'src/agent/lulo/listPendingWithdrawalsBoostedOnly';
import { lulo_get_pools } from 'src/agent/lulo/getPools';
import { lulo_get_rates } from 'src/agent/lulo/getRates';
import Decimal from 'decimal.js';
import BN from 'bn.js';
import { raydium_create_clmm } from 'src/agent/raydium/createClmm';
import { raydium_create_amm_v4 } from 'src/agent/raydium/createAmmV4';
import { raydium_create_cpmm } from 'src/agent/raydium/createCpmm';
import { sanctum_get_owned_lst } from 'src/agent/sanctum/getOwnedLst';
import { meteora_get_dlmm_pool } from 'src/agent/meteora/getDlmmPool';
import { meteora_create_dlmm_balance_position } from './meteora/createDlmmBalancePosition';
import { meteora_create_dlmm_imbalance_position } from './meteora/createDlmmImbalancePosition';
import { meteora_create_dlmm_one_side_position } from './meteora/createDlmmOneSidePosition';
import { meteora_get_list_of_positions } from './meteora/getListOfPositions';
import { meteora_close_position } from './meteora/closePosition';
import { orca_get_position } from 'src/agent/orca/getPosition';
import { orca_open_center_position } from 'src/agent/orca/openCenterPosition';
import { orca_open_singleside_position } from 'src/agent/orca/openSingleSidePosition';
import { orca_close_position } from 'src/agent/orca/closePosition';

export class Agent {
  public connection: Connection;
  public account: Keypair;
  public config?: AgentConfig;

  constructor(private_key: string, rpc_url: string, config?: AgentConfig) {
    this.connection = new Connection(rpc_url);
    this.account = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(private_key)),
    );
    this.config = config;
  }

  async sanctumAddLiquidity(
    lstMint: string,
    amount: string,
    quotedAmount: string,
    priorityFee: number,
  ) {
    return sanctum_add_liquidity(
      this,
      lstMint,
      amount,
      quotedAmount,
      priorityFee,
    );
  }

  async sanctumRemoveLiquidity(
    lstMint: string,
    amount: string,
    quotedAmount: string,
    priorityFee: number,
  ) {
    return sanctum_remove_liquidity(
      this,
      lstMint,
      amount,
      quotedAmount,
      priorityFee,
    );
  }

  async sanctumLSTSwap(
    lstMint: string,
    amount: string,
    quotedAmount: string,
    priorityFee: number,
    outputLstMint: string,
  ) {
    return sanctum_lst_swap(
      this,
      lstMint,
      amount,
      quotedAmount,
      priorityFee,
      outputLstMint,
    );
  }
  async sanctumGetPrice(inputs: string[]) {
    return sanctum_get_price(inputs);
  }

  async sanctumGetTVL(inputs: string[]) {
    return sanctum_get_tvl(inputs);
  }

  async sanctumGetAPY(inputs: string[]) {
    return sanctum_get_apy(inputs);
  }

  async sanctumGetOwnedLst() {
    return sanctum_get_owned_lst(this);
  }

  async wormholeTransferToken(
    destinationChain: Chain,
    network: NetworkType,
    transferAmount: string,
    tokenAddress?: TokenId,
  ) {
    return wormhole_transfer_token(
      this,
      destinationChain,
      network,
      transferAmount,
      tokenAddress,
    );
  }

  async wormholeCreateWrappedToken(
    destinationChain: Chain,
    tokenAddress: string,
    network: NetworkType,
  ) {
    return wormhole_create_wrapped_token(
      this,
      destinationChain,
      tokenAddress,
      network,
    );
  }

  async luloGetAccount() {
    return lulo_get_account(this);
  }

  async luloGetPools() {
    return lulo_get_pools(this);
  }

  async luloGetRates() {
    return lulo_get_rates(this);
  }

  async luloListPendingWithdrawalsBoostedOnly() {
    return lulo_list_pending_withdrawals_boosted_only(this);
  }

  async luloDeposit(
    mintAddress: string,
    protectedAmount?: number,
    regularAmount?: number,
  ) {
    return lulo_deposit(this, mintAddress, protectedAmount, regularAmount);
  }

  async luloWithdrawProtected(mintAddress: string, amount: number) {
    return lulo_withdraw_protected(this, mintAddress, amount);
  }

  async luloInitiateWithdrawalBoostedOnly(mintAddress: string, amount: number) {
    return lulo_initiate_withdrawal_boosted_only(this, mintAddress, amount);
  }

  async luloCompleteWithdrawalBoostedOnly(pendingWithdrawalId: number) {
    return lulo_complete_withdrawal_boosted_only(this, pendingWithdrawalId);
  }

  async solayerGetInfo() {
    return solayer_get_info(this);
  }

  async solayerStakeSol(amount: number) {
    return solayer_stake_sol(this, amount);
  }

  async solanaGetBalance() {
    return solana_get_balance(this);
  }

  async solanaGetTokenBalance(tokenAddress: string) {
    return solana_get_token_balance(this, tokenAddress);
  }

  async solanaGetOwnedToken() {
    return solana_get_owned_token(this);
  }

  async solanaTransferToken(to: string, amount: string, tokenAddress: string) {
    return solana_transfer_token(this, to, amount, tokenAddress);
  }

  async solanaTransfer(to: string, amount: string) {
    return solana_transfer(this, to, amount);
  }

  async raydiumCreateClmm(
    mint1: PublicKey,
    mint2: PublicKey,
    configId: PublicKey,
    initialPrice: Decimal,
    startTime: BN,
  ) {
    return raydium_create_clmm(
      this,
      mint1,
      mint2,
      configId,
      initialPrice,
      startTime,
    );
  }

  async raydiumCreateAmmV4(
    marketId: PublicKey,
    baseAmount: BN,
    quoteAmount: BN,
    startTime: BN,
  ) {
    return raydium_create_amm_v4(
      this,
      marketId,
      baseAmount,
      quoteAmount,
      startTime,
    );
  }

  async raydiumCreateCpmm(
    mintA: PublicKey,
    mintB: PublicKey,
    configId: PublicKey,
    mintAAmount: BN,
    mintBAmount: BN,
    startTime: BN,
  ) {
    return raydium_create_cpmm(
      this,
      mintA,
      mintB,
      configId,
      mintAAmount,
      mintBAmount,
      startTime,
    );
  }

  async meteoraGetDlmmPool(poolAddress: string) {
    return meteora_get_dlmm_pool(poolAddress);
  }

  async meteoraCreateDlmmBalancePosition(
    poolAddress: string,
    baseMintAddress: PublicKey,
    tokenXAmount: number,
    tokenXMint: string,
  ) {
    return meteora_create_dlmm_balance_position(
      this,
      poolAddress,
      baseMintAddress,
      tokenXAmount,
      tokenXMint,
    );
  }

  async meteoraCreateDlmmImbalancePosition(
    poolAddress: string,
    baseMintAddress: PublicKey,
    tokenXAmount: number,
    solAmount: number,
  ) {
    return meteora_create_dlmm_imbalance_position(
      this,
      poolAddress,
      baseMintAddress,
      tokenXAmount,
      solAmount,
    );
  }

  async meteoraCreateDlmmOneSidePosition(
    poolAddress: string,
    baseMintAddress: PublicKey,
    tokenXAmount: number,
  ) {
    return meteora_create_dlmm_one_side_position(
      this,
      poolAddress,
      baseMintAddress,
      tokenXAmount,
    );
  }

  async meteoraGetListOfPositions(poolAddress: string) {
    return meteora_get_list_of_positions(this, poolAddress);
  }

  async meteoraClosePosition(poolAddress: string, positionAddress: string) {
    return meteora_close_position(this, poolAddress, positionAddress);
  }

  async orcaGetPosition() {
    return orca_get_position(this);
  }

  async orcaOpenCenterPosition(
    whirlpoolAddress: string,
    priceOffsetBps: number,
    inputTokenMint: string,
    inputAmount: Decimal,
  ) {
    return orca_open_center_position(
      this,
      whirlpoolAddress,
      priceOffsetBps,
      inputTokenMint,
      inputAmount,
    );
  }

  async orcaOpenSingleSidePosition(
    whirlpoolAddress: string,
    distanceFromCurrentPriceBps: number,
    widthBps: number,
    inputTokenMint: string,
    inputAmount: Decimal,
  ) {
    return orca_open_singleside_position(
      this,
      whirlpoolAddress,
      distanceFromCurrentPriceBps,
      widthBps,
      inputTokenMint,
      inputAmount,
    );
  }

  async orcaClosePosition(positionMint: string) {
    return orca_close_position(this, positionMint);
  }
}
