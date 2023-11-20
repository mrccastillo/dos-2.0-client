import "./ExpandedAnnounce.css";
import Reply from "../post/Reply";
import { Link } from "react-router-dom";
import axios from "axios";
import { useState, useEffect } from "react";

export default function ExpandedAnnounce({
  token,
  announceId,
  userUserId,
  userUsername,
  userFullName,
  content,
  username,
  date,
  fullname,
  onCloseExpandedPost,
}) {
  const [comment, setComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [comments, setComments] = useState([]);

  const fetchComments = async () => {
    const commentsRes = await axios.get(
      `https://backend.dosshs.online/api/announcement/comment/${announceId}`,
      {
        headers: {
          Authorization: token,
        },
      }
    );
    setComments(commentsRes.data.comments.reverse());
  };

  const submitComment = async () => {
    if (commenting) return;

    setCommenting(true);

    const commentObj = {
      profilePicture: "",
      userId: userUserId,
      fullname: userFullName,
      username: userUsername,
      announcementId: announceId,
      content: comment,
    };
    try {
      await axios.post(
        "https://backend.dosshs.online/api/announcement/comment",
        commentObj,
        {
          headers: {
            Authorization: token,
          },
        }
      );
    } catch (err) {
      return console.error(err);
    } finally {
      setComment("");
      setCommenting(false);
      fetchComments();
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);
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
                <p className="display-name">{fullname}</p>
                <p className="username">
                  {<Link to={`/${username}`}>@{username}</Link>}
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
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                }}
              ></textarea>
            </div>
            <button className="reply-btn" onClick={submitComment}>
              Reply
            </button>
          </div>
          <div className="replies-container">
            {comments.map((comment) => (
              <Reply
                key={comment._id}
                fullname={comment.fullname}
                username={comment.username}
                content={comment.content}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
