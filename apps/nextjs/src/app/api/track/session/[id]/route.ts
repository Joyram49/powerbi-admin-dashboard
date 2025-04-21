import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db, userSessions } from "@acme/db";

/**
 * API endpoint to handle user activity tracking on page unload.
 * This is used with navigator.sendBeacon for reliable tracking as the page closes.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { searchParams } = new URL(request.url);
    const activeTime = searchParams.get("activeTime");
    const sessionId = params.id;

    // Validate inputs
    if (!sessionId || !activeTime) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    // Convert active time to seconds for storage
    const activeTimeMs = parseInt(activeTime, 10);
    const activeTimeSec = Math.floor(activeTimeMs / 1000);

    // Find the existing session
    const existingSession = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.id, sessionId))
      .limit(1);

    if (!existingSession.length) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = existingSession[0];
    const sessionStartTime = session?.startTime;

    if (!sessionStartTime) {
      return NextResponse.json(
        { error: "Session start time is missing" },
        { status: 500 },
      );
    }

    const endTime = new Date();
    const totalSessionTime =
      endTime.getTime() - new Date(sessionStartTime).getTime();
    const totalInactiveTime = totalSessionTime - activeTimeMs;

    // Get the previous active and inactive time from database
    const previousActive = session.totalActiveTime;
    const previousInactive = session.totalInactiveTime;

    const newActiveSeconds = activeTimeSec;
    const newInactiveSeconds = Math.floor(totalInactiveTime / 1000);

    const updatedTotalActive = previousActive + newActiveSeconds;
    const updatedTotalInactive = previousInactive + newInactiveSeconds;

    // Update the session
    await db
      .update(userSessions)
      .set({
        endTime,
        totalActiveTime: updatedTotalActive,
        totalInactiveTime: updatedTotalInactive,
      })
      .where(eq(userSessions.id, sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 },
    );
  }
}
