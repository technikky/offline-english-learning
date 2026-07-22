import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import type {
  CefrLevel,
  PlacementBlockDto,
  PlacementStatusResponse,
  SubmitPlacementRequest,
  SubmitPlacementResponse,
} from "@englishclass/types";
import { db } from "../db/client";
import { placementSessions, users } from "../db/schema";
import { authenticate } from "../auth/middleware";
import { recordBlock, startState, type PlacementState } from "../placement/staircase";
import { getBlock, getItemById } from "../placement/items";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

// Builds the student-facing block (no correct answers) for a rung and returns
// both it and the served item ids to persist for grading.
function buildBlock(
  sessionId: string,
  state: PlacementState,
  blockNumber: number,
): { block: PlacementBlockDto; servedItemIds: string[] } {
  const items = getBlock(state.currentLevel);
  return {
    block: {
      sessionId,
      level: state.currentLevel,
      blockNumber,
      items: items.map((item) => ({ id: item.id, question: item.question, options: item.options })),
    },
    servedItemIds: items.map((item) => item.id),
  };
}

export function registerPlacementRoutes(app: FastifyInstance): void {
  app.get("/placement/status", { preHandler: authenticate }, async (request) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, request.authUser!.sub),
    });
    const response: PlacementStatusResponse = {
      placementLevel: (user?.placementLevel as CefrLevel | null) ?? null,
      completedAt: user?.placementCompletedAt ?? null,
    };
    return response;
  });

  app.post("/placement/start", { preHandler: authenticate }, async (request) => {
    const studentId = request.authUser!.sub;

    // Only one in-progress session per student: clear any abandoned ones so a
    // fresh start always resumes cleanly.
    await db
      .delete(placementSessions)
      .where(
        and(
          eq(placementSessions.studentId, studentId),
          eq(placementSessions.status, "in_progress"),
        ),
      );

    const sessionId = randomUUID();
    const state = startState();
    const { block, servedItemIds } = buildBlock(sessionId, state, 1);

    await db.insert(placementSessions).values({
      id: sessionId,
      studentId,
      stateJson: JSON.stringify(state),
      servedItemIdsJson: JSON.stringify(servedItemIds),
      status: "in_progress",
    });

    return block;
  });

  app.post<{ Params: { sessionId: string }; Body: SubmitPlacementRequest }>(
    "/placement/:sessionId/answer",
    { preHandler: authenticate },
    async (request, reply) => {
      const studentId = request.authUser!.sub;
      const session = await db.query.placementSessions.findFirst({
        where: and(
          eq(placementSessions.id, request.params.sessionId),
          eq(placementSessions.studentId, studentId),
          eq(placementSessions.status, "in_progress"),
        ),
      });
      if (!session) {
        return reply.code(404).send({ error: "Placement session not found" });
      }

      const answers = request.body?.answers;
      if (!answers || typeof answers !== "object") {
        return reply.code(400).send({ error: "answers must be an object of itemId -> choice" });
      }

      const servedItemIds = JSON.parse(session.servedItemIdsJson) as string[];
      const state = JSON.parse(session.stateJson) as PlacementState;

      // Grade against exactly the items we served, so the client can't smuggle
      // in items from other rungs.
      let correct = 0;
      for (const itemId of servedItemIds) {
        const item = getItemById(itemId);
        if (item && normalize(answers[itemId] ?? "") === normalize(item.correctAnswer)) {
          correct += 1;
        }
      }

      const nextState = recordBlock(state, correct, servedItemIds.length);

      if (nextState.status === "complete") {
        const resultLevel = nextState.resultLevel ?? "A1";
        const completedAt = new Date().toISOString();
        await db
          .update(placementSessions)
          .set({
            stateJson: JSON.stringify(nextState),
            status: "complete",
            resultLevel,
            completedAt,
          })
          .where(eq(placementSessions.id, session.id));
        await db
          .update(users)
          .set({ placementLevel: resultLevel, placementCompletedAt: completedAt })
          .where(eq(users.id, studentId));

        const response: SubmitPlacementResponse = { complete: true, resultLevel };
        return response;
      }

      const blockNumber = Object.keys(nextState.asked).length + 1;
      const { block, servedItemIds: nextServed } = buildBlock(session.id, nextState, blockNumber);
      await db
        .update(placementSessions)
        .set({
          stateJson: JSON.stringify(nextState),
          servedItemIdsJson: JSON.stringify(nextServed),
        })
        .where(eq(placementSessions.id, session.id));

      const response: SubmitPlacementResponse = { complete: false, block };
      return response;
    },
  );
}
