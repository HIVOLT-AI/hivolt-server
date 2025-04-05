import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { AgentStatus } from 'src/shared/types/agent';

export type SavedAgentDocument = SavedAgent & mongoose.Document;

@Schema({ timestamps: true })
export class SavedAgent {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  owner_id: string;

  @Prop({ required: true })
  agent_id: string;

  @Prop({ required: true, default: 'live' })
  status: AgentStatus;
}

export const SavedAgentSchema = SchemaFactory.createForClass(SavedAgent);
