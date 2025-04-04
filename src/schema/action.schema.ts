import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type ActionDocument = Action & mongoose.Document;

@Schema({ timestamps: true })
export class Action {
  @Prop({ required: true })
  agent_id: string;

  @Prop({ required: true })
  tool_id: string;

  @Prop({ required: true })
  description: string;
}

export const ActionSchema = SchemaFactory.createForClass(Action);
