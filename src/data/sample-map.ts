export type CommunicationMode = "written" | "spoken";

export type Role = {
  id: string;
  label: string;
  detail: string;
  x: number;
  y: number;
  acceptedModes?: CommunicationMode[];
};

export type CommunicationRoute = {
  id: string;
  fromRoleId: string;
  toRoleId: string;
  label: string;
  channelId: string;
  alternate: boolean;
  mode?: CommunicationMode;
};

export const coordinatorId = "coordinator";

export const roles: Role[] = [
  { id: "coordinator", label: "Coordinator", detail: "Main hall", x: 460, y: 266, acceptedModes: ["written", "spoken"] },
  { id: "welcome", label: "Welcome desk", detail: "Front entrance", x: 202, y: 154, acceptedModes: ["written"] },
  { id: "programs", label: "Programs lead", detail: "Activity room", x: 712, y: 126, acceptedModes: ["written"] },
  { id: "pantry", label: "Pantry team", detail: "Community kitchen", x: 742, y: 386, acceptedModes: ["spoken"] },
  { id: "library", label: "Library partner", detail: "Reading room", x: 194, y: 402, acceptedModes: ["spoken"] },
];

export const routes: CommunicationRoute[] = [
  { id: "coord-welcome", fromRoleId: "coordinator", toRoleId: "welcome", label: "Group chat", channelId: "internet", alternate: false, mode: "written" },
  { id: "welcome-programs", fromRoleId: "welcome", toRoleId: "programs", label: "Group chat", channelId: "internet", alternate: false, mode: "written" },
  { id: "coord-pantry", fromRoleId: "coordinator", toRoleId: "pantry", label: "Check-in call", channelId: "phone", alternate: false, mode: "spoken" },
  { id: "coord-library", fromRoleId: "coordinator", toRoleId: "library", label: "Check-in call", channelId: "phone", alternate: false, mode: "spoken" },
  { id: "paper-welcome", fromRoleId: "coordinator", toRoleId: "welcome", label: "Printed notice", channelId: "paper", alternate: true, mode: "written" },
  { id: "paper-programs", fromRoleId: "welcome", toRoleId: "programs", label: "Printed relay", channelId: "paper", alternate: true, mode: "written" },
  { id: "runner-welcome", fromRoleId: "coordinator", toRoleId: "welcome", label: "Spoken relay", channelId: "in-person", alternate: true, mode: "spoken" },
  { id: "runner-programs", fromRoleId: "welcome", toRoleId: "programs", label: "Spoken relay", channelId: "in-person", alternate: true, mode: "spoken" },
  { id: "runner-pantry", fromRoleId: "coordinator", toRoleId: "pantry", label: "Spoken relay", channelId: "in-person", alternate: true, mode: "spoken" },
  { id: "runner-library", fromRoleId: "coordinator", toRoleId: "library", label: "Spoken relay", channelId: "in-person", alternate: true, mode: "spoken" },
];

export const channels = [
  { id: "internet", label: "Internet" },
  { id: "phone", label: "Phone" },
];

export const alternateStrategies = [
  { id: "paper", label: "Paper dispatch", mode: "written" as const, description: "Printed notices · written route" },
  { id: "in-person", label: "Volunteer relay", mode: "spoken" as const, description: "Doorstep check-in · spoken route" },
];

export const alternateRoutes = routes.filter((route) => route.alternate);
