import PusherServer from "pusher";

if (
  !process.env.PUSHER_APP_ID ||
  !process.env.PUSHER_KEY ||
  !process.env.PUSHER_SECRET ||
  !process.env.PUSHER_CLUSTER
) {
  throw new Error("PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER must be set");
}

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

export type SuperchatPayload = {
  id: string;
  viewerName: string;
  message: string | null;
  amount: number;
  currency: string;
  createdAt: string;
};

export async function triggerSuperchat(streamId: string, payload: SuperchatPayload) {
  await pusherServer.trigger(`stream-${streamId}`, "superchat:new", payload);
}
