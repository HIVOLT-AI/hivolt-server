import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from 'mongoose';

export type TransactionLogDocument = TransactionLog & mongoose.Document;

@Schema({ timestamps: true })
export class TransactionLog {
  @Prop({ required: true })
  user_agent_id: string;

  @Prop({ required: true })
  tool_id: string;

  @Prop({ required: true })
  tool_name: string;

  @Prop({ required: true })
  log: string;

  @Prop({ required: true })
  owner_id: string;

  @Prop({ required: true })
  status: string;
  
  @Prop({ required: true })
  solscan_url: string;

  @Prop({ required: true })
  tx_hash: string;

  @Prop({ required: true })
  date: string;
}           

export const TransactionLogSchema = SchemaFactory.createForClass(TransactionLog);