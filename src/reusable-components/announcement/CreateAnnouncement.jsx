import { useState } from "react";
import axios from "axios";
import "./CreateAnnouncement.css";

export default function CreateAnnouncement({
  fullname,
  username,
  userId,
  onAnnouncementCreated,
  onModalClose,
}) {
  const [content, setContent] = useState("");
  const [isCreatingAnnouncement, setIsCreatingAnnouncement] =
    useState("Announce");

  async function handleAnnouncementSubmit(e) {
    setIsCreatingAnnouncement("Announce");
    e.preventDefault();
    const announce = {
      userId: userId,
      username: username,
      fullname: fullname,
      title: "testtitle",
      content: content,
    };

    try {
      setIsCreatingAnnouncement("Posting your Announcement...");
      const token = localStorage.getItem("token");
      await axios.post(
        "https://backend.dosshs.online/api/announcement",
        announce,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      onModalClose();
      onAnnouncementCreated();
    } catch (e) {
      console.error("error:", e);
    }
    console.log(announce);
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
            <textarea
              className="create-post-announce-content"
              placeholder="What would you like to Announce?"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
              }}
            ></textarea>
            <div className="post-category">
              <select className="select">
                <option value="">General</option>
                <option value="">PUP</option>
                <option value="">Question</option>
                <option value="">Rant</option>
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
