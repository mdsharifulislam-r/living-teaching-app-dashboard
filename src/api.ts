export * from "./api-client";
export { adminApi } from "./api-client";

/*
export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
        headers.set("Authorization", `Bearer ${token}`);Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Admin", "User", "Notification", "Comment", "Verse"],
  endpoints: (builder) => ({
    loginAdmin: builder.mutation<ApiEnvelope & { token?: string; data?: AdminRecord }, { email: string; password: string }>({
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
      query: () => ({ url: "/admin/me" }),
      transformResponse: (response: { data?: AdminRecord }) => response.data ?? ({} as AdminRecord),
      providesTags: ["Admin"],
    }),
    getAdmins: builder.query<AdminListResponse, void>({
      query: () => ({ url: "/admin" }),
      providesTags: ["Admin"],
    }),
    getUsers: builder.query<UserListResponse, { page?: number; limit?: number; search?: string; status?: string }>({
      query: ({ page = 1, limit = 20, search, status } = {}) => ({
        url: "/users",
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
          ...(status ? { status } : {}),
        },
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
    deleteUser: builder.mutation<ApiEnvelope, { id: string }>({
      query: ({ id }) => ({
        url: `/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
    getComments: builder.query<CommentListResponse, { page?: number; limit?: number; search?: string; status?: string }>({
      query: ({ page = 1, limit = 20, search, status } = {}) => ({
        url: "/comments",
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
          ...(status ? { status } : {}),
        },
      }),
      providesTags: ["Comment"],
    }),
    getCommentById: builder.query<CommentRecord, string>({
      query: (id) => ({ url: `/comments/${id}` }),
      transformResponse: (response: { data?: CommentRecord }) => response.data ?? ({} as CommentRecord),
      providesTags: (_, __, id) => [{ type: "Comment", id }],
    }),
    replyToComment: builder.mutation<ApiEnvelope, { id: string; body: { message: string } }>({
      query: ({ id, body }) => ({
        url: `/comments/${id}/reply`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Comment"],
    }),
    getAdminById: builder.query<AdminRecord, string>({
      query: (id) => ({ url: `/admin/${id}` }),
      transformResponse: (response: { data?: AdminRecord }) => response.data ?? ({} as AdminRecord),
      providesTags: (_, __, id) => [{ type: "Admin", id }],
    }),
    createAdmin: builder.mutation<ApiEnvelope, Partial<AdminRecord> & { name: string; email: string }>({
      query: (body) => ({
        url: "/admin",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Admin"],
    }),
    updateAdmin: builder.mutation<ApiEnvelope, { id: string; body: Partial<AdminRecord> }>({
      query: ({ id, body }) => ({
        url: `/admin/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_, __, arg) => [{ type: "Admin", id: arg.id }],
    }),
    deleteAdmin: builder.mutation<ApiEnvelope, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Admin"],
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
  useCreateAdminMutation,
  useUpdateAdminMutation,
  useDeleteAdminMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useSendNotificationMutation,
  useResendNotificationMutation,
  useGetVersesQuery,
  useCreateVerseMutation,
  useUpdateVerseMutation,
  useDeleteVerseMutation,
  useSetVerseOfDayMutation,
} = adminApi;
*/
