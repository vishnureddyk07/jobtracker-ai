import { runAssistantGraph } from "../ai/assistantGraph.js";
import { searchKnowledge, getAllQuestions } from "../ai/knowledgeBase.js";

export default async function aiRoutes(fastify) {
  fastify.get("/ai/health", async () => ({ status: "ok" }));

  fastify.post("/ai/assistant", async (request, reply) => {
    const { input, currentFilters } = request.body || {};

    if (!input) {
      return reply.code(400).send({ message: "Input is required" });
    }

    const result = await runAssistantGraph({ input, currentFilters });
    return reply.send(result);
  });

  // Search knowledge base
  fastify.post("/ai/search", async (request, reply) => {
    const { query } = request.body || {};

    if (!query) {
      return reply.code(400).send({ message: "Query is required" });
    }

    const results = searchKnowledge(query);
    return reply.send({ results, total: results.length });
  });

  // Get all questions
  fastify.get("/ai/questions", async (request, reply) => {
    const questions = getAllQuestions();
    return reply.send({ 
      total: questions.length, 
      questions: questions.slice(0, 50) // Return first 50 for preview
    });
  });

  // Get random question
  fastify.get("/ai/random-question", async (request, reply) => {
    const { getRandomQuestion } = await import("../ai/knowledgeBase.js");
    const question = getRandomQuestion();
    return reply.send(question);
  });
}
