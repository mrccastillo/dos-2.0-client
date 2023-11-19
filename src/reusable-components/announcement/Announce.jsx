import { Link } from "react-router-dom";
import { useState } from "react";

export default function Announce({ fullname, username, content, date }) {
  const [isAnnounceLiked, setIsAnnounceLiked] = useState(false);

  function handleLike() {
    setIsAnnounceLiked(!isAnnounceLiked);
  }
  const formattedDate = date.slice(0, 10);

  return (
    <div className="post">
      <div className="post-content-container">
        <div className="post-details">
          <div className="post-author-info">
            <div className="post-header">
              <div className="profile-pic"></div>
              <div className="post-author">
                <p className="display-name">{fullname}</p>
                <p className="username">
                  <Link to={`/${username}`}>@{username}</Link>
                </p>
              </div>
            </div>
            <div className="report-post"></div>
          </div>
        </div>
        <div className="post-content --announce">
          <p>{content}</p>
        </div>
      </div>
      <div className="post-interaction">
        <div className="like-container">
          <div
            className={
              isAnnounceLiked
                ? "announcement-like --isAnnouncementLiked"
                : "announcement-like"
            }
            // style={{
            //   width: "1.3rem",
            //   height: "1.3rem",
            // }}
            onClick={handleLike}
          ></div>
          <p className="announce-like-count" style={{ marginTop: "0.3rem" }}>
            1000
          </p>
        </div>
        <div className="comment-container">
          <div
            className="comment-icon"
            style={{
              width: "1.2rem",
              height: "1.2rem",
            }}
          ></div>
          <p className="announce-comment-count" style={{ marginTop: "0.3rem" }}>
            50 Comments
          </p>
        </div>
      </div>
      <div className="date announcement-date">{formattedDate}</div>
    </div>
  );
}
