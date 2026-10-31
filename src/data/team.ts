import { isoDay } from "./content";

// ---------------------------------------------------------------------------
// Team, roles & permissions for the ministry dashboard
// ---------------------------------------------------------------------------
export type Role = "admin" | "editor" | "moderator";
export type MemberStatus = "active" | "invited" | "disabled";

export type Perm =
  | "content.edit" // add, edit, delete content
  | "content.publish" // publish / unpublish
  | "push.send" // push notifications
  | "users.view" // user statistics & list
  | "users.manage" // add, suspend, reactivate members
  | "users.delete" // delete member accounts
  | "team.manage"; // add team, change roles

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: MemberStatus;
  title?: string;
  phone?: string;
  bio?: string;
  avatar?: string; // URL or uploaded data URL
  addedAt: string; // yyyy-mm-dd
  permissions?: string[];
  superAdmin?: boolean;
}

export const ROLE_ORDER: Role[] = ["admin", "editor", "moderator"];

export const ROLES: Record<Role, { label: string; short: string; desc: string; perms: Perm[]; badge: string; dot: string }> = {
  admin: {
    label: "Admin",
    short: "Full access",
    desc: "Full control: content, notifications, members and the team itself.",
    perms: ["content.edit", "content.publish", "push.send", "users.view", "users.manage", "users.delete", "team.manage"],
    badge: "bg-gold-50 text-gold-600",
    dot: "bg-gold-500",
  },
  editor: {
    label: "Editor",
    short: "Creates content",
    desc: "Writes and manages prayers, audio, teachings, images and push notifications.",
    perms: ["content.edit", "content.publish", "push.send"],
    badge: "bg-brand-50 text-brand-700",
    dot: "bg-brand-500",
  },
  moderator: {
    label: "Moderator",
    short: "Looks after the community",
    desc: "Views members and statistics, suspends accounts, and can unpublish content.",
    perms: ["content.publish", "users.view", "users.manage"],
    badge: "bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
  },
};

/** Rows of the permission table shown on the Team screen. */
export const CAPABILITIES: { perm: Perm | "view"; label: string }[] = [
  { perm: "view", label: "View the dashboard and all content" },
  { perm: "content.edit", label: "Add, edit and delete content" },
  { perm: "content.publish", label: "Publish or unpublish content" },
  { perm: "push.send", label: "Send push notifications" },
  { perm: "users.view", label: "See user statistics and the member list" },
  { perm: "users.manage", label: "Add, suspend or reactivate members" },
  { perm: "users.delete", label: "Delete member accounts" },
  { perm: "team.manage", label: "Manage the team and roles" },
];

export const roleCan = (role: Role, perm: Perm | "view") => perm === "view" || ROLES[role].perms.includes(perm);

export const seedTeam = (): TeamMember[] => [
  {
    id: "t1", name: "Pastor Daniel Reyes", email: "admin@livingteaching.org", role: "admin", status: "active",
    title: "Ministry Director", phone: "+1 (555) 123-4567", bio: "Leading the Living Teaching ministry team and app.", addedAt: isoDay(-420),
  },
  {
    id: "t2", name: "Ruth Allen", email: "ruth.allen@livingteaching.org", role: "editor", status: "active",
    title: "Content Editor", bio: "Writes and schedules prayers, teachings and daily encouragement.", addedAt: isoDay(-210),
  },
  {
    id: "t3", name: "Samuel Okafor", email: "samuel.okafor@livingteaching.org", role: "moderator", status: "active",
    title: "Community Moderator", addedAt: isoDay(-95),
  },
  {
    id: "t4", name: "Esther Silva", email: "esther.silva@livingteaching.org", role: "editor", status: "invited",
    title: "Audio Producer", addedAt: isoDay(-3),
  },
];
