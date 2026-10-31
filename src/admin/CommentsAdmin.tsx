import { useMemo, useState } from "react";
import { MessageSquareText, Search, Send, ShieldCheck } from "lucide-react";
import { type CommentRecord, type ManagedContentRecord, useGetCommentsQuery, useGetManagedContentQuery, useReplyToCommentMutation } from "../api-client";
import { inputCls } from "./shared";

const STATUS_OPTIONS = ["all", "pending", "approved", "rejected", "hidden"] as const;

interface CommentPost {
  id: string;
  title: string;
  type: string;
}

function extractRecords(response: unknown): ManagedContentRecord[] {
  if (!response || typeof response !== "object") return [];
  if (Array.isArray(response)) return response.filter((item): item is ManagedContentRecord => !!item && typeof item === "object");
  const record = response as Record<string, unknown>;
  for (const key of ["data", "items", "results", "posts"]) {
    const records = extractRecords(record[key]);
    if (records.length) return records;
  }
  return [];
}

function normalizeComments(response: unknown): CommentRecord[] {
  if (!response || typeof response !== "object") return [];
  if (Array.isArray(response)) return response as CommentRecord[];
  const record = response as Record<string, unknown>;
  for (const key of ["data", "comments", "items", "results"]) {
    const nested = record[key];
    if (Array.isArray(nested)) return nested as CommentRecord[];
    const items = normalizeComments(nested);
    if (items.length) return items;
  }
  return [];
}

export function CommentsManager() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [selectedPostId, setSelectedPostId] = useState("");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState("");

  const prayersQuery = useGetManagedContentQuery("prayer");
  const audioQuery = useGetManagedContentQuery("audio");
  const teachingsQuery = useGetManagedContentQuery("teaching");
  const encouragementsQuery = useGetManagedContentQuery("encouragement");
  const imagesQuery = useGetManagedContentQuery("image");
  const posts = useMemo(() => {
    const sources: [string, unknown][] = [
      ["Prayer", prayersQuery.data],
      ["Audio", audioQuery.data],
      ["Teaching", teachingsQuery.data],
      ["Encouragement", encouragementsQuery.data],
      ["Image", imagesQuery.data],
    ];
    return sources.flatMap(([type, response]) =>
      extractRecords(response).flatMap((record) => {
        const id = typeof record._id === "string" ? record._id : typeof record.id === "string" ? record.id : "";
        if (!id) return [];
        const title = [record.title, record.name, record.heading].find((value): value is string => typeof value === "string" && value.trim().length > 0);
        return [{ id, title: title ?? `${type} ${id.slice(-6)}`, type }];
      })
    );
  }, [prayersQuery.data, audioQuery.data, teachingsQuery.data, encouragementsQuery.data, imagesQuery.data]);
  const selectedPost = posts.find((post) => post.id === selectedPostId);
  const { data, isLoading, isError, error, refetch } = useGetCommentsQuery(
    { postId: selectedPostId },
    { skip: !selectedPostId }
  );
  const [replyToComment, { isLoading: isReplying }] = useReplyToCommentMutation();
  const comments = useMemo(() => normalizeComments(data), [data]);
  const visibleComments = useMemo(() => comments.filter((comment) => {
    const matchesStatus = status === "all" || (comment.status ?? "pending").toLowerCase() === status;
    const text = `${comment.content ?? ""} ${comment.message ?? ""} ${comment.user?.name ?? ""} ${comment.user?.email ?? ""}`.toLowerCase();
    return matchesStatus && (!search.trim() || text.includes(search.trim().toLowerCase()));
  }), [comments, search, status]);
  const postsLoading = [prayersQuery, audioQuery, teachingsQuery, encouragementsQuery, imagesQuery].some((query) => query.isLoading);
  const postsError = [prayersQuery, audioQuery, teachingsQuery, encouragementsQuery, imagesQuery].some((query) => query.isError);

  const handleReply = async (commentId: string) => {
    const trimmed = replyText.trim();
    if (!trimmed || !commentId) return;

    try {
      setReplyError("");
      await replyToComment({ id: commentId, body: { content: trimmed } }).unwrap();
      setReplyText("");
      setReplyingId(null);
    } catch (error) {
      const message = error && typeof error === "object" && "data" in error
        && error.data && typeof error.data === "object" && "message" in error.data && typeof error.data.message === "string"
        ? error.data.message
        : "Unable to send reply.";
      setReplyError(message);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight">Comments</h2>
          <p className="mt-1 text-[15px] text-mute">
            Review user comments, check the conversation thread, and reply from the admin dashboard.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row">
        <select
          value={selectedPostId}
          onChange={(event) => {
            setSelectedPostId(event.target.value);
            setReplyingId(null);
            setReplyText("");
            setReplyError("");
          }}
          aria-label="Select a post to review comments"
          className={inputCls + " md:max-w-sm"}
        >
          <option value="">{postsLoading ? "Loading posts…" : "Select a post to review comments"}</option>
          {posts.map((post) => <option key={`${post.type}-${post.id}`} value={post.id}>{post.type}: {post.title}</option>)}
        </select>
        <div className="flex min-w-[220px] flex-1 items-center gap-2.5 rounded-full bg-white px-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand-500">
          <Search size={18} className="text-brand-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search comments or users"
            className="w-full bg-transparent py-3 text-[15px] outline-none"
          />
        </div>
        <div className="flex gap-1.5 rounded-full bg-white p-1 ring-1 ring-line">
          {STATUS_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={item === status ? "rounded-full bg-brand-700 px-3 py-2 text-[13px] font-bold text-white" : "rounded-full px-3 py-2 text-[13px] font-bold text-mute"}
            >
              {item === "all" ? "All" : item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {!postsLoading && posts.length === 0 && (
          <div role="alert" className="rounded-3xl bg-amber-50 p-6 text-[15px] font-medium text-amber-800 shadow-soft">
            No posts could be loaded. Comments are retrieved by post, so check that your account can access the content endpoints.
          </div>
        )}
        {postsError && posts.length > 0 && (
          <div role="alert" className="rounded-2xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-800">
            Some post types could not be loaded, so their comments may not appear in the selection.
          </div>
        )}
        {selectedPost && !isLoading && !isError && (
          <p className="text-[13px] text-mute">Showing comments for <b>{selectedPost.type}: {selectedPost.title}</b>.</p>
        )}
        {!selectedPostId && posts.length > 0 && (
          <div className="rounded-3xl bg-white p-8 text-center text-[15px] text-mute shadow-soft">
            Select a post above to load its comments.
          </div>
        )}
        {isLoading && <div className="rounded-3xl bg-white p-6 text-[15px] text-mute shadow-soft">Loading comments…</div>}
        {isError && (
          <div className="rounded-3xl bg-red-50 p-6 text-[15px] font-medium text-red-700 shadow-soft">
            {(error as { data?: { message?: string } } | undefined)?.data?.message ?? "Unable to load comments for this post."}
            <button type="button" onClick={() => void refetch()} className="ml-3 font-bold underline">Retry</button>
          </div>
        )}
        {selectedPostId && !isLoading && !isError && visibleComments.length === 0 && (
          <div className="rounded-3xl bg-white p-12 text-center shadow-soft">
            <MessageSquareText size={30} className="mx-auto text-brand-300" />
            <p className="mt-3 text-[16px] font-semibold">No comments found</p>
            <p className="mt-1 text-[14px] text-mute">There are no user comments matching the current filter.</p>
          </div>
        )}

        {!isLoading && !isError && visibleComments.map((comment) => {
          const userName = comment.user?.name ?? "Unknown user";
          const statusLabel = comment.status ?? "pending";
          return (
            <article key={comment._id ?? comment.id} className="rounded-3xl bg-white p-4 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-600">{statusLabel}</p>
                  <h3 className="mt-1 text-[18px] font-bold">{userName}</h3>
                  <p className="text-[13px] text-mute">{comment.user?.email ?? "No email"}</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-[12px] font-semibold text-brand-700">
                  <ShieldCheck size={14} /> {comment.post?.title ?? "General feedback"}
                </div>
              </div>

              <p className="mt-4 rounded-2xl bg-paper p-4 text-[15px] leading-relaxed text-ink">
                {comment.content ?? comment.message ?? "No comment text available."}
              </p>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3 text-[12px] text-mute">
                <span>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : "No date"}</span>
                <button type="button" onClick={() => {
                  setReplyingId(comment._id ?? comment.id ?? null);
                  setReplyError("");
                }} className="font-bold text-brand-700">
                  Reply
                </button>
              </div>

              {(comment.reply || comment.replies?.length) && (
                <div className="mt-4 space-y-2 rounded-2xl bg-brand-50 p-3">
                  {(comment.reply ? [comment.reply] : comment.replies ?? []).map((reply, index) => (
                    <div key={`${comment._id ?? comment.id}-reply-${index}`} className="rounded-xl bg-white p-3">
                      <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-brand-700">Admin reply</p>
                      <p className="mt-2 text-[14px] leading-relaxed text-ink">{reply.message}</p>
                      <p className="mt-1 text-[12px] text-mute">{reply.createdAt ? new Date(reply.createdAt).toLocaleString() : ""}</p>
                    </div>
                  ))}
                </div>
              )}

              {replyingId === (comment._id ?? comment.id) && (
                <div className="mt-4 rounded-2xl border border-line bg-paper p-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    placeholder="Write a reply to the user"
                    className={inputCls + " min-h-[100px] resize-y"}
                  />
                  <div className="mt-3 flex justify-end">
                    {replyError && <p role="alert" className="mr-auto self-center text-[13px] text-red-700">{replyError}</p>}
                    <button type="button" disabled={isReplying || !replyText.trim()} onClick={() => void handleReply(comment._id ?? comment.id ?? "")} className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-50">
                      <Send size={16} /> Send reply
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
