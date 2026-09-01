import React, { useState, useEffect, useRef } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const TaskDiscussionModal = ({ task, onClose }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const chatBottomRef = useRef(null);

  const fetchComments = async () => {
    if (!task?.id) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/tasks/${task.id}/comments`);
      if (res.data.status) {
        setComments(res.data.comments);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [task?.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || sending) return;

    try {
      setSending(true);
      setError("");
      const res = await api.post(`/api/tasks/${task.id}/comments`, { message: newComment.trim() });
      if (res.data.status) {
        setComments((prev) => [...prev, res.data.comment]);
        setNewComment("");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send comment");
    } finally {
      setSending(false);
    }
  };

  if (!task) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow-lg border-0">
          <div className="modal-header bg-dark text-white">
            <div>
              <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                <i className="bi bi-chat-dots-fill text-primary"></i>
                Task Discussion: {task.title}
              </h5>
              <small className="text-muted">
                Assigned to: {task.assigned_to_name || "Employee"} • Priority: {task.priority?.toUpperCase()}
              </small>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-3 bg-light" style={{ minHeight: "350px", maxHeight: "450px", overflowY: "auto" }}>
            {error && <div className="alert alert-danger py-2">{error}</div>}

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">Loading discussion thread...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-chat-square-text fs-1"></i>
                <p className="mt-2 mb-0">No messages yet. Start the conversation about this task below!</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {comments.map((c) => {
                  const isMe = c.sender_id === user?.id;
                  return (
                    <div
                      key={c.id}
                      className={`d-flex flex-column ${isMe ? "align-items-end" : "align-items-start"}`}
                    >
                      <div className="d-flex align-items-center gap-1 mb-1" style={{ fontSize: "11px" }}>
                        <span className="fw-bold text-dark">{c.sender_name}</span>
                        <span className={`badge ${c.sender_role === "supervisor" ? "bg-success" : c.sender_role === "manager" ? "bg-primary" : "bg-secondary"}`}>
                          {c.sender_role}
                        </span>
                        <span className="text-muted ms-1">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`p-3 rounded-3 shadow-sm ${isMe ? "bg-primary text-white" : "bg-white text-dark border"}`}
                        style={{ maxWidth: "80%", wordBreak: "break-word" }}
                      >
                        {c.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>
            )}
          </div>

          <div className="modal-footer bg-white">
            <form onSubmit={handleSendComment} className="w-100 d-flex gap-2">
              <input
                type="text"
                className="form-control"
                placeholder="Type your message, query, or update here..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={sending}
              />
              <button type="submit" className="btn btn-primary px-4 d-flex align-items-center gap-1" disabled={sending || !newComment.trim()}>
                {sending ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-send-fill"></i>}
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDiscussionModal;
