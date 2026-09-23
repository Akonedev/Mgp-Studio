import { cookies } from "next/headers";
import AgentChatClient from "./AgentChatClient";

/**
 * Server component — fetches agentDetails from the /api/agents proxy
 * (which forwards to https://api.muapi.ai/agents/by-slug/{id})
 * using the muapi_key cookie for auth, then renders the client chat component.
 *
 * URL: /agents/[agent_id]   (new chat — no conversation ID yet)
 */
export async function generateMetadata({ params }) {
  const { agent_id } = await params;
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
    console.error('[AgentPage] Error reading local agents:', e);
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

export default async function AgentPage({ params }) {
  const { agent_id } = await params;
  const cookieStore = await cookies();
  const apiKey = cookieStore.get("muapi_key")?.value;

  console.log(`[AgentPage] Loading page for agent: ${agent_id}, hasKey: ${!!apiKey}`);

  const [agentDetails, userData] = await Promise.all([
    fetchAgentDetails(agent_id, apiKey),
    fetchUserData(apiKey)
  ]);

  return (
    <AgentChatClient 
      agentDetails={agentDetails} 
      initialHistory={null} 
      userData={userData}
    />
  );
}
