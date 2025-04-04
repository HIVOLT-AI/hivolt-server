export enum AgentStatus {
  live = 'live',
  paused = 'paused',
}

export type AgentConfig = {
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  LULO_API_KEY?: string;
};
