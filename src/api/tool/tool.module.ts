import { Module } from '@nestjs/common';
import { ToolController } from 'src/api/tool/tool.controller';
import { ToolService } from 'src/api/tool/tool.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Tool, ToolSchema } from 'src/schema/tool.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Tool', schema: ToolSchema }])],
  controllers: [ToolController],
  providers: [ToolService],
})
export class ToolModule {}
