export type ExerciseScenario = {
  id: string;
  channelId: "internet" | "phone";
  title: string;
  setup: string;
  readAloud: string;
  discussionCue: string;
};

export const exerciseScenarios: ExerciseScenario[] = [
  {
    id: "room-change",
    channelId: "internet",
    title: "Room change, dead Wi-Fi",
    setup: "The afternoon reading circle moves to the east room ten minutes before guests arrive. The coordinator needs to update four volunteer roles, but Wi-Fi has failed.",
    readAloud: "The meeting room has changed to East Room. The group chat is down. Get that update to every role using the routes on this board.",
    discussionCue: "Which role can confirm the update reached everyone, rather than only confirm that a route was tried?",
  },
  {
    id: "pickup-entrance",
    channelId: "phone",
    title: "Pickup entrance, silent line",
    setup: "The community pantry opens in twenty minutes. The check-in phone line is down, and the entrance for pickup has changed.",
    readAloud: "The pickup entrance has changed to the side door. Calls are not going through. What route gets the update to each role?",
    discussionCue: "If a role never receives the update, how would the group notice before pickup begins?",
  },
];
