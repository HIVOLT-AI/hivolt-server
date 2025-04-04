export enum ToolType {
  sanctum = 'sanctum',
  jito = 'jito',
  wormhole = 'wormhole',
  zeus = 'zeus',
  metaplex = 'metaplex',
  meteora = 'meteora',
  radium = 'radium',
  lulo = 'lulo',
}

export type ToolShape = {
  name: string;
  description: string;
  type: ToolType;
};

export type ToolArgsType = { [x: string]: unknown } | undefined;
