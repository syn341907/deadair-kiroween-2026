import { coordinatorId, roles, routes } from "./sample-map";
import type { CommunicationRoute, Role } from "./sample-map";

export type ExercisePackage = {
  version: 1;
  id: string;
  title: string;
  setup: string;
  readAloud: string;
  discussionCue: string;
  objective: string;
  initialFailedChannelId: string;
  coordinatorId: string;
  inject: { id: string; title: string; body: string; failedChannelId: string };
  roles: Role[];
  routes: CommunicationRoute[];
};

function starter(options: Omit<ExercisePackage, "version" | "coordinatorId" | "roles" | "routes">): ExercisePackage {
  return { ...options, version: 1, coordinatorId, roles, routes };
}

export const exerciseScenarios: ExercisePackage[] = [
  starter({
    id: "room-change",
    title: "Room change, dead Wi-Fi",
    setup: "The afternoon reading circle moves to the east room ten minutes before guests arrive. The coordinator needs to update four volunteer roles, but Wi-Fi has failed.",
    readAloud: "The meeting room has changed to East Room. The group chat is down. Get that update to every role using the routes on this board.",
    discussionCue: "Which role can confirm the update reached everyone, rather than only confirm that a route was tried?",
    objective: "Give every role a usable route for the room change and a way to acknowledge it.",
    initialFailedChannelId: "internet",
    inject: {
      id: "phone-also-down",
      title: "A second line goes quiet",
      body: "The check-in phone has stopped working too. Keep the room-change update moving, then look for a way to confirm it came through.",
      failedChannelId: "phone",
    },
  }),
  starter({
    id: "pickup-entrance",
    title: "Pickup entrance, silent line",
    setup: "The community pantry opens in twenty minutes. The check-in phone line is down, and the entrance for pickup has changed.",
    readAloud: "The pickup entrance has changed to the side door. Calls are not going through. What route gets the update to each role?",
    discussionCue: "If a role never receives the update, how would the group notice before pickup begins?",
    objective: "Give every role a usable route for the entrance change and a way to acknowledge it.",
    initialFailedChannelId: "phone",
    inject: {
      id: "wifi-also-down",
      title: "The group chat drops too",
      body: "The group chat is unavailable too. Keep the entrance update moving, then look for a way to confirm it came through.",
      failedChannelId: "internet",
    },
  }),
];
