import { Link } from "react-router-dom";
import { useState } from "react";
import "./Post.css";

export default function Post({
  fullname,
  username,
  content,
  date,
  category,
  isAnonymous,
}) {
  const [isLiked, setIsLiked] = useState(false);
  function handleLike() {
    setIsLiked(!isLiked);
  }

  const newDate = date.slice(0, 10);
  return (
    <div className="post">
      <div className="post-content-container">
        <div className="post-details">
          <div className="post-author-info">
            <div className="post-header">
              <div className="profile-pic"></div>
              <div className="post-author">
                <p className="display-name">
                  {isAnonymous ? "Anonymous" : fullname}
                </p>
                <p className="username">
                  {!isAnonymous && <Link to={`/${username}`}>@{username}</Link>}
                </p>
                <p className="date">{newDate}</p>
              </div>
            </div>
            <div className="delete"></div>
          </div>
          <div className="report-post-container"></div>
        </div>
        <div className="post-content">
          <p className="category">
            #
            {category === 0
              ? "General"
              : category === 1
              ? "PUP"
              : category === 2
              ? "Question"
              : category === 3 && "Rant"}
          </p>
          <p style={{ fontSize: "0.95rem" }}>{content}</p>
        </div>
      </div>
      <div className="post-interaction">
        <div className="like-container">
          <div
            className={isLiked ? "like-icon --isLiked" : "like-icon"}
            // style={{
            //   background-image: isLiked
            //     ? "url(../../assets/images/heart-filled.png)"
            //     : "url(../../assets/images/heart.png)",
            // }}
            onClick={handleLike}
          ></div>
          <p className="like-count">1000</p>
        </div>
        <div className="comment-container">
          <div className="comment-icon"></div>
          <p className="comment-count">50 Comments</p>
        </div>
        <div className="report-post"></div>
      </div>
    </div>
  );
}
