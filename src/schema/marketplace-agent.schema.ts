import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Tool } from './tool.schema';
import { Mcp } from './mcp.schema';

export type MarketplaceAgentDocument = MarketplaceAgent & mongoose.Document;

@Schema({ timestamps: true })
export class MarketplaceAgent {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ required: true, type: [Tool] })
  tools: Tool[];

  @Prop({ required: true, type: [Mcp] })
  mcps: Mcp[];

  @Prop({ required: true })
  version: string;

  @Prop({ required: true })
  author: string;

  @Prop({ required: true, default: true })
  is_active: boolean;

  @Prop({ required: true, default: 0 })
  install_count: number;

  @Prop({ required: true, type: mongoose.Schema.Types.Mixed, default: {} })
  metadata: Record<string, any>;
}

export const MarketplaceAgentSchema = SchemaFactory.createForClass(MarketplaceAgent); 