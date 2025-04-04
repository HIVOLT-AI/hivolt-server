import Anthropic from '@anthropic-ai/sdk';
import { ENV } from 'src/config/env.config';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import {
  MessageParam,
  Tool,
} from '@anthropic-ai/sdk/resources/messages/messages.mjs';
import { ANTHROPIC_MODEL } from 'src/shared/constants';
import { ToolArgsType } from 'src/shared/types/tool';

class MCPClient {
  public isConnected = false;
  private mcp: Client;
  private anthropic: Anthropic;
  private transport: SSEClientTransport;
  private tools: Tool[] = [];
  private messages: MessageParam[] = [];
  private systemPrompt: string;
  private finalResponse: string[] = [];
  private toolResponse: string[] = [];

  constructor(name: string, endpoint: string, prompt: string) {
    this.mcp = new Client({ name, version: '0.0.1' }, { capabilities: {} });
    this.anthropic = new Anthropic({
      apiKey: ENV.ANTHROPIC_API_KEY,
    });
    this.transport = new SSEClientTransport(new URL(endpoint));
    this.systemPrompt = prompt;
  }

  async connect() {
    try {
      this.mcp.connect(this.transport);
      const toolList = await this.mcp.listTools();
      this.tools = await Promise.all(
        toolList.tools.map((tool) => {
          return {
            name: tool.name,
            description: tool.description,
            input_schema: tool.inputSchema,
          };
        }),
      );
      this.isConnected = true;
    } catch (error: any) {
      throw new Error(`Failed to connect to MCP: ${error.message}`);
    }
  }

  async disconnect() {
    await this.mcp.close();
    this.isConnected = false;
  }

  async addConversation(query: string) {
    try {
      const userPrompt: MessageParam = {
        role: 'user',
        content: query,
      };

      this.messages.push(userPrompt);
      const response = await this.anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 1000,
        messages: this.messages,
        tools: this.tools,
        system: this.systemPrompt,
      });

      for (const content of response.content) {
        if (content.type === 'text') {
          this.finalResponse.push(content.text);
        } else if (content.type === 'tool_use') {
          const toolName = content.name;
          const toolArgs = content.input;

          const toolResult = await this.mcp.callTool({
            name: toolName,
            arguments: toolArgs as ToolArgsType,
          });

          this.toolResponse.push(toolResult.toolResult as string);
          this.finalResponse.push(
            `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`,
          );

          const assistantPrompt: MessageParam = {
            role: 'assistant',
            content: toolResult.toolResult as string,
          };
          this.messages.push(assistantPrompt);
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to add conversation: ${error.message}`);
    }
  }
}

export const createMcpClient = ({ name, endpoint, prompt }) => {
  const mcpClient = new MCPClient(name, endpoint, prompt);
  return mcpClient;
};
