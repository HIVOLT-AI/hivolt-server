import Anthropic from '@anthropic-ai/sdk';
import { MessageParam } from '@anthropic-ai/sdk/resources';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ENV } from 'src/config/env.config';
import { Client } from 'src/mcp-client';
import { SSEClientTransport } from 'src/mcp-client/sse';
import { Agent } from 'src/schema/agent.schema';
import { ANTHROPIC_MODEL } from 'src/shared/constants';
import { createMcpClient } from 'src/shared/handler/mcp';

const client = new Client(
  {
    name: 'mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {},
  },
);

const anthropic = new Anthropic({
  apiKey: ENV.ANTHROPIC_API_KEY,
});

@Injectable()
export class WorkerService {
  constructor(
    @InjectModel('Agent')
    private readonly agentModel: Model<Agent>,
  ) {}

  async run_all_task() {
    const agents = await this.agentModel.find();
    for (const agent of agents) {
      this.run(agent);
    }
  }

  async run(agent: Agent) {}

  async run_task(id: string) {
    const agent = await this.agentModel.findById(id);
    if (!agent) {
      throw new Error('Agent not found');
    }
    this.run(agent);
  }

  async run_test() {
    const transport = new SSEClientTransport(
      new URL('https://hibolt-mcp.memetus.store/sse/solana'),
    );

    await client.connect(transport);

    const toolList = await client.listTools();

    const tools = await Promise.all(
      toolList.tools.map((tool) => {
        return {
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema,
        };
      }),
    );

    console.log('tools', tools);

    const messages: MessageParam[] = [
      {
        role: 'user',
        content: 'Fetch user SOL balance',
      },
    ];

    const finalText: string[] = [];
    const toolResults = [];

    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1000,
      messages,
      tools,
      system: '',
    });

    for (const content of response.content) {
      console.log('content', content);
      if (content.type === 'text') {
        finalText.push(content.text);
      } else if (content.type === 'tool_use') {
        // Execute tool call
        const toolName = content.name;
        const toolArgs = content.input as { [x: string]: unknown } | undefined;

        const result = await client.callTool({
          name: toolName,
          arguments: toolArgs,
        });
        console.log('Tool Result:', result);
        toolResults.push(result as never);
        finalText.push(
          `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`,
        );

        messages.push({
          role: 'user',
          content: result.content as string,
        });

        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages,
          tools,
        });

        console.log('Tool Result:', response);

        console.log('Tool Result:', toolResults);

        finalText.push(
          response.content[0].type === 'text' ? response.content[0].text : '',
        );
      }
    }

    console.log('Tool List:', toolList);
  }
}
