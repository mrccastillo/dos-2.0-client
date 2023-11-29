import { useState } from "react";
import "../post/ReportPost.css";
import axios from "axios";
import Cookies from "js-cookie";
import { URL } from "../../App";

function Feedback({ fullname, username, userId, onCloseFeedback }) {
  const [content, setContent] = useState("");
  const [category, setCategoy] = useState(0);
  const [isSending, setIsSending] = useState("Send");
  const [sending, setSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleFeedbackSubmit(e) {
    e.preventDefault();
    if (sending) return;
    if (!content) return;

    const trimmedFeedback = content.trim();
    const validatedFeedback = trimmedFeedback.replace(/\u2800/g, "");
    if (!validatedFeedback) {
      return;
    }

    setSending(true);
    setIsSending("Send");

    const feedback = {
      userId: userId,
      username: username,
      fullname: fullname,
      content: content,
      category: category,
      dateCreated: Date.now(),
    };

    try {
      setIsSending("Sending...");
      const token = Cookies.get("token");
      await axios.post(`${URL}/feedback`, feedback, {
        headers: {
          Authorization: token,
        },
      });
      setIsSent(true);
    } catch (e) {
      setSending("Post");
      console.error("error:", e);
    }
  }

  function onCloseModal() {
    onCloseFeedback();
  }

  if (!isSent) {
    return (
      <>
        <form
          className="create-post-announcement-modal"
          onSubmit={handleFeedbackSubmit}
        >
          <div>
            <div className="post-announcement-modal-header">
              <h2>Send Feedback</h2>
            </div>
            <div className="post-announcement-modal-content">
              <div className="post-author-info">
                <div className="post-header">
                  <div className="profile-pic"></div>
                  <div className="post-author">
                    <p
                      className="display-name --white-text"
                      style={{ fontWeight: 500 }}
                    >
                      {fullname}
                    </p>
                    <p className="username --white-text">@{username}</p>
                  </div>
                </div>
              </div>
              <textarea
                className="create-post-announce-content"
                placeholder="What would you like to send?"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                }}
              ></textarea>
              <div className="post-category">
                <select
                  className="select"
                  style={{ width: "15rem", padding: "0 1rems" }}
                  onClick={(e) => {
                    setCategoy(e.target.value);
                  }}
                >
                  <option value="0">Feedback</option>
                  <option value="1">Suggest a Feature</option>
                  <option value="2">Suggest a Category</option>
                  <option value="3">Report a Bug</option>
                </select>
              </div>
            </div>
          </div>
          <div className="btn-container">
            <button className="submit-post">{isSending}</button>
          </div>
          <p className="close-btn" onClick={onCloseModal}>
            &times;
          </p>
        </form>{" "}
        <div className="overlay"></div>
      </>
    );
  } else {
    return (
      <>
        <div className="report-post-modal">
          <h2 className="report-post-header">Feedback</h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div className="success-image"></div>
            <h2 style={{ marginBottom: "0.5rem" }}> Successfully Submitted!</h2>
            <p style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
              We will notify the DOS Team about your concern.
            </p>
            <p
              style={{
                fontWeight: "700",
                fontSize: "0.85rem",
                marginBottom: "0.5rem",
              }}
            >
              THANK YOU FOR KEEPING THE DOS A SAFE PLACE!
            </p>
            <div className="roblox-face"></div>
            <button
              className="save-user-changes"
              style={{ border: "0" }}
              onClick={onCloseModal}
            >
              Close
            </button>
          </div>
        </div>
        <div className="overlay"></div>
      </>
    );
  }
}

export default Feedback;
