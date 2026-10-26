"use client";

import CommentModeration from "../../components/CommentModeration";

export default function AdminCommentsPage() {
  return (
    <CommentModeration scopeText="All comments from readers. You can delete any comment." />
  );
}
