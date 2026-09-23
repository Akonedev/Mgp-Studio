import { cookies } from "next/headers";
import AgentChatClient from "../AgentChatClient";

/**
 * Server component — fetches both agentDetails and initialHistory
 * from the /api/agents proxy using the muapi_key cookie, then renders
 * the client chat component with existing conversation messages pre-loaded.
 *
 * URL: /agents/[agent_id]/[conversation_id]
 */
export async function generateMetadata({ params }) {
  return {
    title: `Agent Chat — Open Generative AI`,
  };
}

import fs from 'fs';
import path from 'path';

function fetchAgentDetails(agentId) {
  try {
    const agentsPath = path.join(process.cwd(), 'data', 'local_agents.json');
    if (fs.existsSync(agentsPath)) {
      const agents = JSON.parse(fs.readFileSync(agentsPath, 'utf-8'));
      const found = agents.find(a => a.id === agentId || a.slug === agentId);
      if (found) return found;
    }
  } catch (e) {
    console.error('[ConvPage] Error reading local agents:', e);
  }
  return {
    id: agentId,
    slug: agentId,
    name: agentId.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: 'Expert Assistant local pour la production cinématographique et vidéo.',
    avatar: '🎬',
    system_prompt: 'Tu es un assistant expert en production vidéo et scénarisation pour Open-Generative-AI.'
  };
}

function fetchHistory(agentId, conversationId) {
  return null;
}

function fetchUserData() {
  return {
    user: {
      username: 'Studio User',
      name: 'Studio User',
      email: 'user@spark.local'
    },
    balance: 'Illimité (DGX Spark)'
  };
}

export default async function AgentConversationPage({ params }) {
  const { agent_id, conversation_id } = await params;
  const cookieStore = await cookies();
  const apiKey = cookieStore.get("muapi_key")?.value;

  console.log(`[ConvPage] Loading for agent: ${agent_id}, conv: ${conversation_id}, hasKey: ${!!apiKey}`);

  const [agentDetails, initialHistory, userData] = await Promise.all([
    fetchAgentDetails(agent_id, apiKey),
    fetchHistory(agent_id, conversation_id, apiKey),
    fetchUserData(apiKey)
  ]);

  return (
    <AgentChatClient 
      agentDetails={agentDetails} 
      initialHistory={initialHistory} 
      userData={userData}
    />
  );
}
