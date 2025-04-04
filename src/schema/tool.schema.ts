import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ToolType } from 'src/shared/types/tool';

@Schema({ timestamps: true })
export class Tool {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  prompt: string;

  @Prop({ required: true })
  type: ToolType;
}

export const ToolSchema = SchemaFactory.createForClass(Tool);
