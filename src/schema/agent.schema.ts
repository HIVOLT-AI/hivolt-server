import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { AgentStatus } from 'src/shared/types/agent';
import { Schema as MongooseSchema } from 'mongoose';
import { Tool } from 'src/schema/tool.schema';
import { Mcp } from 'src/schema/mcp.schema';

export type AgentDocument = Agent & mongoose.Document;

@Schema({ timestamps: true })
export class Agent {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  owner_id: string;

  @Prop({ required: true })
  nav: number;

  @Prop({ required: true })
  realized_pnl: number;

  @Prop({ required: true })
  unrealized_pnl: number;

  @Prop({ required: true })
  total_pnl_percentage: number;

  @Prop({ required: true, default: 'live' })
  status: AgentStatus;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed, default: [] })
  tools: Tool[];

  @Prop({ required: true, type: MongooseSchema.Types.Mixed, default: [] })
  mcps: Mcp[];
}

export const AgentSchema = SchemaFactory.createForClass(Agent);
