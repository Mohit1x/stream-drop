import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerk = await clerkClient();

  let tokenResponse;
  try {
    tokenResponse = await clerk.users.getUserOauthAccessToken(userId, "google");
  } catch {
    return NextResponse.json({ connected: false, error: "youtube_not_connected" });
  }

  const tokenData = tokenResponse.data[0];
  if (!tokenData?.token) {
    return NextResponse.json({ connected: false, error: "youtube_not_connected" });
  }

  const scopes = tokenData.scopes ?? [];
  const hasYouTubeScope = scopes.some(
    (s) => s.includes("youtube.readonly") || s.includes("youtube")
  );
  if (!hasYouTubeScope) {
    return NextResponse.json({ connected: false, error: "youtube_scope_missing" });
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: tokenData.token });
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  try {
    const channelRes = await youtube.channels.list({
      part: ["snippet"],
      mine: true,
    });

    const channel = channelRes.data.items?.[0];
    if (!channel) {
      return NextResponse.json({
        connected: true,
        channel: null,
        liveStream: null,
        error: "no_channel",
      });
    }

    const channelInfo = {
      id: channel.id!,
      title: channel.snippet?.title ?? "",
      thumbnailUrl: channel.snippet?.thumbnails?.default?.url ?? null,
    };

    // broadcastStatus=active finds ONLY currently live streams, not scheduled or completed
    const liveRes = await youtube.liveBroadcasts.list({
      part: ["snippet", "status"],
      broadcastStatus: "active",
      broadcastType: "all",
      maxResults: 1,
    });

    const liveBroadcast = liveRes.data.items?.[0];

    // Fetch last 5 completed livestreams in parallel
    const pastRes = await youtube.liveBroadcasts.list({
      part: ["snippet", "status"],
      broadcastStatus: "completed",
      broadcastType: "all",
      maxResults: 5,
    });

    const pastStreams = (pastRes.data.items ?? []).map((item) => {
      const s = item.snippet!;
      const t = s.thumbnails as Record<string, { url?: string }> | undefined;
      return {
        videoId: item.id!,
        title: s.title ?? "",
        description: s.description ?? "",
        thumbnailUrl: t?.maxres?.url ?? t?.high?.url ?? t?.medium?.url ?? t?.default?.url ?? null,
        channelId: s.channelId ?? channelInfo.id,
        channelTitle: channelInfo.title,
        publishedAt: s.publishedAt ?? null,
      };
    });

    if (!liveBroadcast) {
      return NextResponse.json({
        connected: true,
        channel: channelInfo,
        liveStream: null,
        pastStreams,
      });
    }

    const videoId = liveBroadcast.id!;
    const snippet = liveBroadcast.snippet!;
    const thumbnails = snippet.thumbnails as Record<string, { url?: string }> | undefined;
    const thumbnailUrl =
      thumbnails?.maxres?.url ??
      thumbnails?.high?.url ??
      thumbnails?.medium?.url ??
      thumbnails?.default?.url ??
      null;

    return NextResponse.json({
      connected: true,
      channel: channelInfo,
      liveStream: {
        videoId,
        title: snippet.title ?? "",
        description: snippet.description ?? "",
        thumbnailUrl,
        channelId: snippet.channelId ?? channelInfo.id,
        channelTitle: channelInfo.title,
        publishedAt: snippet.publishedAt ?? null,
      },
      pastStreams,
    });
  } catch (err: unknown) {
    const error = err as { code?: number; message?: string };
    if (error?.code === 403) {
      return NextResponse.json({ connected: false, error: "youtube_forbidden" });
    }
    if (error?.code === 401) {
      return NextResponse.json({ connected: false, error: "youtube_not_connected" });
    }
    console.error("[youtube/live-stream]", error?.message);
    return NextResponse.json(
      { connected: false, error: "youtube_api_error" },
      { status: 500 }
    );
  }
}
