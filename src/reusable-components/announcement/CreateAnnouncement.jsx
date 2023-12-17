import { useState } from "react";
import axios from "axios";
import "./CreateAnnouncement.css";
import Cookies from "js-cookie";
import { URL } from "../../App";

export default function CreateAnnouncement({
  fullname,
  username,
  userId,
  onAnnouncementCreated,
  onModalClose,
}) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(4);
  const [isCreatingAnnouncement, setIsCreatingAnnouncement] =
    useState("Announce");
  const [announcing, setAnnouncing] = useState(false);

  async function handleAnnouncementSubmit(e) {
    e.preventDefault();
    if (announcing) return;
    if (!content) return;

    const trimmedAnnouncement = content.trim();
    const validatedAnnouncement = trimmedAnnouncement.replace(/\u2800/g, "");
    if (!validatedAnnouncement) {
      return;
    }

    setAnnouncing(true);
    setIsCreatingAnnouncement("Announce");

    const announce = {
      userId: userId,
      username: username,
      fullname: fullname,
      content: content,
      category: category,
    };

    try {
      setIsCreatingAnnouncement("Posting your Announcement...");
      const token = Cookies.get("token");
      await axios.post(`${URL}/announcement`, announce, {
        headers: {
          Authorization: token,
        },
      });
      onModalClose();
      onAnnouncementCreated();
    } catch (e) {
      console.error("error:", e);
    } finally {
      setAnnouncing(false);
    }
  }

  function closeModal() {
    onModalClose();
  }

  return (
    <>
      <form
        className="create-post-announcement-modal"
        onSubmit={handleAnnouncementSubmit}
      >
        <div>
          <div className="post-announcement-modal-header">
            <h2>Create Announcement</h2>
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
              placeholder="What would you like to Announce?"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
              }}
            ></textarea>
            <div className="post-category">
              <select
                className="select"
                onClick={(e) => {
                  setCategory(e.target.value);
                }}
              >
                <option value="0">DOS</option>
                <option value="1">PUP</option>
                <option value="2">SHS</option>
                <option value="3">ICT</option>
                <option value="4">ICT 12 - 1</option>
                <option value="5">ICT 12 - 2</option>
              </select>
            </div>
          </div>
        </div>
        <div className="btn-container">
          <button className="submit-post">{isCreatingAnnouncement}</button>
        </div>
        <p className="close-btn" onClick={closeModal}>
          &times;
        </p>
      </form>
      <div className="overlay"></div>
    </>
  );
}
