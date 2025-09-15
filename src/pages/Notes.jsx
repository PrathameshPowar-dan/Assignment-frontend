import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Context } from "../context/authContext.jsx";

const API_BASE = window.location.hostname.includes('localhost')
  ? 'http://localhost:5000'
  : 'https://assignment-backend-teal.vercel.app';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [notesLoading, setNotesLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState("");
  const { user, loading, logout, CheckAuth } = useContext(Context);
  const navigate = useNavigate();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail) return;

    setInviting(true);
    try {
      await axios.post(
        `${API_BASE}/api/user/invite`,
        { email: inviteEmail, role: inviteRole },
        { withCredentials: true }
      );
      alert("User invited successfully!");
      setInviteEmail("");
      setInviteRole("member");
      setShowInviteModal(false);
    } catch (err) {
      alert(err.response?.data?.message || "Invitation failed");
    } finally {
      setInviting(false);
    }
  };

  useEffect(() => {
    if (!user && !loading) {
      navigate("/login");
      return;
    }
    if (user) {
      fetchNotes();
    }
  }, [user, loading]);

  const fetchNotes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/note`, {
        withCredentials: true,
      });
      setNotes(res.data.data);
      setNotesLoading(false);
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/note`, newNote, {
        withCredentials: true,
      });
      setNewNote({ title: "", content: "" });
      fetchNotes();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error creating note";
      alert(errorMsg);

      if (errorMsg.includes("Upgrade to Pro")) {
        setError(errorMsg);
      }
    }
  };

  const handleUpgrade = async () => {
    if (!user?.tenant?.slug) return;

    setUpgrading(true);
    setError("");

    try {
      await axios.post(
        `${API_BASE}/api/tenants/${user.tenant.slug}/upgrade`,
        {},
        { withCredentials: true }
      );
      alert("Upgrade successful! Your account has been upgraded to Pro.");

      await CheckAuth();
      fetchNotes();
    } catch (err) {
      setError(err.response?.data?.message || "Upgrade failed");
    } finally {
      setUpgrading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/note/${id}`, {
        withCredentials: true,
      });
      fetchNotes();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting note");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading || notesLoading) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border mb-3" />
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  const isAtFreeLimit = user.tenant?.plan === "free" && notes.length >= 3;
  const canCreateNotes = !isAtFreeLimit || user.tenant?.plan === "pro";

  return (
    <div className="container py-5">
      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Invite User</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowInviteModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter user's email"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail}
                >
                  {inviting ? "Inviting..." : "Invite User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal backdrop */}
      {showInviteModal && <div className="modal-backdrop show"></div>}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">{user.tenant?.name || "My Tenant"}</h2>
          <p className="text-muted mb-0">Logged in as {user.email}</p>
        </div>
        <div>
          <span className={`badge ${user.tenant?.plan === "pro" ? "bg-success" : "bg-secondary"} me-2`}>
            Plan: {user.tenant?.plan}
          </span>
          <span className="badge bg-primary">Role: {user.role}</span>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {isAtFreeLimit && (
        <div className="alert alert-warning d-flex justify-content-between align-items-center">
          <span>You've reached the free plan limit of 3 notes.</span>
          {user.role === "admin" ? (
            <button
              className="btn btn-sm btn-warning"
              onClick={handleUpgrade}
              disabled={upgrading}
            >
              {upgrading ? "Upgrading..." : "Upgrade to Pro"}
            </button>
          ) : (
            <span>Contact your admin to upgrade</span>
          )}
        </div>
      )}

      {user.role === "admin" && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title mb-3">Admin Actions</h5>
            {user.tenant?.plan === "free" && (
              <button
                className="btn btn-warning me-2"
                onClick={handleUpgrade}
                disabled={upgrading}
              >
                {upgrading ? "Upgrading..." : "Upgrade to Pro"}
              </button>
            )}
            <button
              className="btn btn-outline-primary"
              onClick={() => setShowInviteModal(true)}
            >
              Invite User
            </button>
          </div>
        </div>
      )}

      {canCreateNotes && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title mb-3">Create a Note</h5>
            <form onSubmit={handleCreate}>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Note title"
                  value={newNote.title}
                  onChange={(e) =>
                    setNewNote({ ...newNote, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="mb-3">
                <textarea
                  className="form-control"
                  placeholder="Note content"
                  rows="3"
                  value={newNote.content}
                  onChange={(e) =>
                    setNewNote({ ...newNote, content: e.target.value })
                  }
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Add Note
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="row g-3">
        {notes.length === 0 ? (
          <div className="col-12">
            <div className="alert alert-info text-center">
              No notes yet. {canCreateNotes ? "Create your first note above!" : "Upgrade to create more notes."}
            </div>
          </div>
        ) : (
          notes.map((note) => (
            <div className="col-md-6" key={note._id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{note.title}</h5>
                  <p className="card-text flex-grow-1 text-muted">
                    {note.content}
                  </p>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <small className="text-muted">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </small>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(note._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-center mt-5">
        <button className="btn btn-outline-secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}