import "./ExpandedPost.css";
import Reply from "./Reply";
import { Link } from "react-router-dom";

export default function ExpandedPost({
  category,
  content,
  username,
  date,
  isAnonymous,
  fullname,
  onCloseExpandedPost,
}) {
  return (
    <div className="expanded-post-modal-background">
      <div className="expanded-post-modal">
        <div className="post-details">
          <div className="post-author-info">
            <div className="post-header">
              <div
                className="profile-pic"
                style={{ width: "3.5rem", height: "3.5rem" }}
              ></div>
              <div className="post-author">
                <p className="display-name">
                  {isAnonymous ? "Anonymous" : fullname}
                </p>
                <p className="username">
                  {!isAnonymous && <Link to={`/${username}`}>@{username}</Link>}
                </p>
                <p className="date">{date}</p>
              </div>
            </div>
            <div className="delete" onClick={onCloseExpandedPost}></div>
          </div>
          <div className="report-post-container"></div>
        </div>
        <div className="post-content" style={{ padding: "1rem 0" }}>
          <div className="contents">
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
          <div
            className="post-interaction"
            style={{
              borderBottom: " 1px solid rgb(93, 93, 93)",
              padding: "1.5rem 0",
            }}
          >
            <div className="like-container">
              <div
                className={/*isLiked ? "like-icon --isLiked" : */ "like-icon"}
                // style={{
                //   background-image: isLiked
                //     ? "url(../../assets/images/heart-filled.png)"
                //     : "url(../../assets/images/heart.png)",
                // }}
                // onClick={handleLike}
              ></div>
              <p className="like-count">{/*likeCounts*/}</p>
            </div>
            <div className="comment-container">
              <div
                className="comment-icon"
                // onClick={() => {
                //   setIsPostOpen(!isPostOpen);
                // }}
              ></div>
              <p className="comment-count">{/*commentCount*/} Comments</p>
            </div>
          </div>
          <div className="reply-to-post">
            <div className="user-reply">
              <div className="profile-pic"></div>
              <textarea
                placeholder="Post your reply"
                className="reply-textarea"
              ></textarea>
            </div>
            <button className="reply-btn">Reply</button>
          </div>
          <div className="replies-container">
            <Reply />
            <Reply />
            <Reply />
            <Reply />
            <Reply />
          </div>
        </div>
      </div>
    </div>
  );
}
