export type OrcaPositionInfo = {
  whirlpoolAddress: string;
  positionInRange: boolean;
  distanceFromCenterBps: number;
};

export type OrcaPositionDataMap = {
  [address: string]: OrcaPositionInfo;
};
