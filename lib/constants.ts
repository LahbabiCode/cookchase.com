/**
 * Comment threads are capped at 3 levels: comment → reply → reply-to-reply.
 * Shared by the public API (depth enforcement), the frontend (Reply buttons
 * + indent caps) and the admin API (same cap for admin replies) so the
 * limits can never drift between files.
 */
export const MAX_COMMENT_DEPTH = 3;
