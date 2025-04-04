import { Prop, Schema } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type McpDocument = Mcp & mongoose.Document;

@Schema({ timestamps: true })
export class Mcp {
  @Prop({ required: true })
  endpoint: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  prompt: string;
}
