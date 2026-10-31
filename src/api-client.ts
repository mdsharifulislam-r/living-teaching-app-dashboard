import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL, getAuthToken } from "./config";

export interface AdminRecord {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  status?: "active" | "inactive" | "suspended" | string;
  role?: string;
  subrole?: string;
  image?: string;
  permissions?: string[];
  isSuperAdmin?: boolean;
  superAdmin?: boolean;
  password?: string;
  verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  country?: string;
}

export interface PaginationMeta {
  total?: number;
  limit?: number;
  page?: number;
  totalPage?: number;
}

export interface AdminListResponse {
  success: boolean;
  message?: string;
  pagination?: PaginationMeta;
  data: AdminRecord[];
}

export type NotificationType = "prayer" | "audio" | "teaching" | "encouragement" | "image" | "other";

export interface NotificationRecord {
  _id: string;
  title: string;
  receiver?: string[];
  message?: string;
  filePath?: string;
  image?: string;
  type?: NotificationType;
  isRead?: boolean;
  readers?: string[];
  is_scheduled?: boolean;
  scheduled_date?: string;
  scheduled_time?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationListResponse {
  success: boolean;
  message?: string;
  pagination?: PaginationMeta;
  data: {
    unreadCount?: number;
    data: NotificationRecord[];
  };
}

export interface UserRecord {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  status?: "active" | "inactive" | "suspended" | string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
  avatar?: string;
  image?: string;
  phone?: string;
}

export interface UserListResponse {
  success: boolean;
  message?: string;
  pagination?: PaginationMeta;
  data: UserRecord[] | { pages?: number; total?: number; items?: UserRecord[]; data?: UserRecord[] };
}

export interface UserStatisticsResponse {
  success: boolean;
  message?: string;
  data: {
    statistics: {
      registeredMembers: number;
      activeMembers: number;
      suspendedMembers: number;
      newThisWeek: number;
      newLast30Days: number;
      growth30Days: {
        change: number;
        current: number;
        previous: number;
        percentage: number | null;
      };
    };
    graph: {
      range: string;
      totalMembers: Array<{
        date: string;
        newMembers: number;
        totalMembers: number;
      }>;
      newRegistrations: Array<{
        date: string;
        members: number;
      }>;
    };
  };
}

export interface CommentRecord {
  _id?: string;
  id?: string;
  user?: { _id?: string; id?: string; name?: string; email?: string; avatar?: string } | null;
  content?: string;
  message?: string;
  status?: "pending" | "approved" | "rejected" | "hidden" | string;
  createdAt?: string;
  updatedAt?: string;
  reply?: { _id?: string; author?: string; message?: string; createdAt?: string } | null;
  replies?: Array<{ _id?: string; author?: string; message?: string; createdAt?: string }>;
  post?: { _id?: string; title?: string; type?: string } | null;
}

export interface CommentListResponse {
  success: boolean;
  message?: string;
  pagination?: PaginationMeta;
  data: CommentRecord[] | { total?: number; pages?: number; data?: CommentRecord[]; items?: CommentRecord[] };
}

export type VerseStatus = "published" | "draft" | "scheduled";

export interface VerseRecord {
  _id?: string;
  id?: string;
  content: string;
  reference: string;
  status: VerseStatus;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  isVerseOfDay?: boolean;
  verseOfDayDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface VerseListResponse {
  success: boolean;
  message?: string;
  pagination?: PaginationMeta;
  data: VerseRecord[];
}

export interface VersePayload {
  content: string;
  reference: string;
  status: VerseStatus;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
}

export interface ApiEnvelope {
  success?: boolean;
  message?: string;
  data?: unknown;
}

function unwrapAdminRecord(response: unknown): AdminRecord {
  if (!response || typeof response !== "object") return {};
  const record = response as Record<string, unknown>;
  const data = record.data;
  const source = data && typeof data === "object" ? data as Record<string, unknown> : record;
  for (const key of ["admin", "user", "profile"]) {
    const nested = source[key];
    if (nested && typeof nested === "object") return { ...source, ...nested } as AdminRecord;
  }
  return source as AdminRecord;
}

export type ManagedContentResource =
  | "prayer"
  | "audio"
  | "teaching"
  | "image"
  | "encouragement"
  | "social-links";

export interface ManagedContentRecord {
  _id?: string;
  id?: string;
  status?: "published" | "draft" | "scheduled";
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  [key: string]: unknown;
}

export interface ManagedContentListResponse {
  success: boolean;
  message?: string;
  pagination?: PaginationMeta;
  data: ManagedContentRecord[];
}

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Admin", "User", "Notification", "Comment", "Verse", "ManagedContent"],
  endpoints: (builder) => ({
    loginAdmin: builder.mutation<ApiEnvelope & {
      token?: string;
      accessToken?: string;
      access_token?: string;
      user?: AdminRecord;
      admin?: AdminRecord;
      profile?: AdminRecord;
      data?: AdminRecord & {
        token?: string;
        accessToken?: string;
        access_token?: string;
        user?: AdminRecord;
        admin?: AdminRecord;
        profile?: AdminRecord;
      };
    }, { email: string; password: string }>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),
    logoutAdmin: builder.mutation<ApiEnvelope, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),
    getCurrentAdmin: builder.query<AdminRecord, void>({
      query: () => ({ url: "/user/profile" }),
      transformResponse: unwrapAdminRecord,
      providesTags: ["Admin"],
    }),
    getAdmins: builder.query<AdminListResponse, { page?: number; limit?: number } | void>({
      query: (params) => ({
        url: "/admin",
        params: params ? { page: params.page ?? 1, limit: params.limit ?? 100 } : undefined,
      }),
      providesTags: (result) => [
        { type: "Admin", id: "LIST" },
        ...(result?.data ?? []).flatMap((admin) => {
          const id = admin._id ?? admin.id;
          return id ? [{ type: "Admin" as const, id }] : [];
        }),
      ],
    }),
    getUsers: builder.query<UserListResponse, { page?: number; limit?: number; searchTerm?: string }>({
      query: ({ page = 1, limit = 20, searchTerm } = {}) => ({
        url: "/admin/users",
        params: {
          page,
          limit,
          ...(searchTerm ? { searchTerm } : {}),
        },
      }),
      providesTags: ["User"],
    }),
    getUserStatistics: builder.query<UserStatisticsResponse, { range: string }>({
      query: ({ range }) => ({
        url: "/admin/users/statistics",
        params: { range },
      }),
      providesTags: ["User"],
    }),
    getUserById: builder.query<UserRecord, string>({
      query: (id) => ({ url: `/users/${id}` }),
      transformResponse: (response: { data?: UserRecord }) => response.data ?? ({} as UserRecord),
      providesTags: (_, __, id) => [{ type: "User", id }],
    }),
    updateUser: builder.mutation<ApiEnvelope, { id: string; body: Partial<UserRecord> }>({
      query: ({ id, body }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    toggleUserStatus: builder.mutation<ApiEnvelope, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/users/toggle-status/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["User"],
    }),
    deleteUser: builder.mutation<ApiEnvelope, { id: string }>({
      query: ({ id }) => ({
        url: `/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
    getComments: builder.query<CommentListResponse, { postId: string }>({
      query: ({ postId }) => ({ url: `/comment/${postId}` }),
      providesTags: ["Comment"],
    }),
    getCommentById: builder.query<CommentRecord, string>({
      query: (id) => ({ url: `/comment/${id}` }),
      transformResponse: (response: { data?: CommentRecord }) => response.data ?? ({} as CommentRecord),
      providesTags: (_, __, id) => [{ type: "Comment", id }],
    }),
    replyToComment: builder.mutation<ApiEnvelope, { id: string; body: { content: string } }>({
      query: ({ id, body }) => ({
        url: `/comment/${id}/reply`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Comment"],
    }),
    getAdminById: builder.query<AdminRecord, string>({
      query: (id) => ({ url: `/admin/${id}` }),
      transformResponse: unwrapAdminRecord,
      providesTags: (_, __, id) => [{ type: "Admin", id }],
    }),
    createAdmin: builder.mutation<ApiEnvelope, Partial<AdminRecord> & { name: string; email: string; password?: string }>({
      query: (body) => ({
        url: "/admin",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Admin", "User"],
    }),
    updateAdmin: builder.mutation<ApiEnvelope, { id: string; body: Partial<AdminRecord> }>({
      query: ({ id, body }) => ({
        url: `/admin/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_, __, arg) => [{ type: "Admin", id: "LIST" }, { type: "Admin", id: arg.id }, "Admin", "User"],
    }),
    deleteAdmin: builder.mutation<ApiEnvelope, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Admin", "User"],
    }),
    getNotifications: builder.query<NotificationListResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 50 } = {}) => ({
        url: "/notification",
        params: { page, limit },
      }),
      providesTags: ["Notification"],
    }),
    markNotificationRead: builder.mutation<ApiEnvelope, { id: string }>({
      query: ({ id }) => ({
        url: `/notification/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),
    markAllNotificationsRead: builder.mutation<ApiEnvelope, void>({
      query: () => ({
        url: "/notification",
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),
    sendNotification: builder.mutation<ApiEnvelope, FormData>({
      query: (body) => ({
        url: "/notification/send-notifications",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Notification"],
    }),
    resendNotification: builder.mutation<ApiEnvelope, { id: string }>({
      query: ({ id }) => ({
        url: `/notification/${id}/resend`,
        method: "POST",
      }),
      invalidatesTags: ["Notification"],
    }),
    getManagedContent: builder.query<ManagedContentListResponse, ManagedContentResource>({
      query: (resource) => ({
        url: `/${resource}`,
        params: { page: 1, limit: 100 },
      }),
      providesTags: (_, __, resource) => [{ type: "ManagedContent", id: resource }],
    }),
    createManagedContent: builder.mutation<ApiEnvelope, { resource: ManagedContentResource; body: FormData | Record<string, string> }>({
      query: ({ resource, body }) => ({
        url: `/${resource}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_, __, { resource }) => [{ type: "ManagedContent", id: resource }],
    }),
    updateManagedContent: builder.mutation<ApiEnvelope, { resource: ManagedContentResource; id: string; body: FormData | Record<string, string> }>({
      query: ({ resource, id, body }) => ({
        url: `/${resource}/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_, __, { resource }) => [{ type: "ManagedContent", id: resource }],
    }),
    deleteManagedContent: builder.mutation<ApiEnvelope, { resource: ManagedContentResource; id: string }>({
      query: ({ resource, id }) => ({
        url: `/${resource}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, { resource }) => [{ type: "ManagedContent", id: resource }],
    }),
    getVerses: builder.query<VerseListResponse, { page?: number; limit?: number; search?: string; status?: VerseStatus }>({
      query: ({ page = 1, limit = 10, search, status } = {}) => ({
        url: "/verse",
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
          ...(status ? { status } : {}),
        },
      }),
      providesTags: (result) => [
        { type: "Verse", id: "LIST" },
        ...(result?.data ?? []).flatMap((verse) => {
          const id = verse._id ?? verse.id;
          return id ? [{ type: "Verse" as const, id }] : [];
        }),
      ],
    }),
    createVerse: builder.mutation<ApiEnvelope, VersePayload>({
      query: (body) => ({
        url: "/verse",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Verse", id: "LIST" }],
    }),
    updateVerse: builder.mutation<ApiEnvelope, { id: string; body: VersePayload }>({
      query: ({ id, body }) => ({
        url: `/verse/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: "Verse", id: "LIST" }, { type: "Verse", id }],
    }),
    deleteVerse: builder.mutation<ApiEnvelope, { id: string }>({
      query: ({ id }) => ({
        url: `/verse/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Verse", id: "LIST" }],
    }),
    setVerseOfDay: builder.mutation<ApiEnvelope, { id: string; date: string }>({
      query: ({ id, date }) => ({
        url: `/verse/${id}/set-verse-of-day`,
        method: "PATCH",
        body: { date },
      }),
      invalidatesTags: [{ type: "Verse", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAdminsQuery,
  useGetAdminByIdQuery,
  useGetCurrentAdminQuery,
  useLoginAdminMutation,
  useLogoutAdminMutation,
  useCreateAdminMutation,
  useUpdateAdminMutation,
  useDeleteAdminMutation,
  useGetUsersQuery,
  useGetUserStatisticsQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useToggleUserStatusMutation,
  useDeleteUserMutation,
  useGetCommentsQuery,
  useGetCommentByIdQuery,
  useReplyToCommentMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useSendNotificationMutation,
  useResendNotificationMutation,
  useGetManagedContentQuery,
  useCreateManagedContentMutation,
  useUpdateManagedContentMutation,
  useDeleteManagedContentMutation,
  useGetVersesQuery,
  useCreateVerseMutation,
  useUpdateVerseMutation,
  useDeleteVerseMutation,
  useSetVerseOfDayMutation,
} = adminApi;
