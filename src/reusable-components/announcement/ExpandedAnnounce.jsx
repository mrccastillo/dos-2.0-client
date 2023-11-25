import "./ExpandedAnnounce.css";
import Reply from "../post/Reply";
import CommentSkeleton from "../skeletonloading/CommentsSkeleton";
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
  liked,
  likeId,
  likeCount,
  onCommentUpdate,
  onLike,
  hasComments,
  fetchedComments,
  onFetchedComments,
}) {
  const [comment, setComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [comments, setComments] = useState([]);
  const [isLiked, setIsLiked] = useState(liked);
  const [announceLikeId, setLikeId] = useState(likeId);
  const [likeCounts, setlikeCounts] = useState(likeCount);
  const [likeInProgress, setLikeInProgress] = useState(false);
  const [isCommentFetching, setIsCommentFetching] = useState(true);

  async function handleLike() {
    if (likeInProgress) return;

    setLikeInProgress(true);

    try {
      if (!isLiked) {
        const likePost = {
          announcementId: announceId,
          userId: userUserId,
          username: userUsername,
        };
        const likeRes = await axios.post(
          "https://backend.dosshs.online/api/announcement/like",
          likePost,
          {
            headers: {
              Authorization: token,
            },
          }
        );
        setLikeId(likeRes.data.like._id);
        onLike(likeRes.data.like._id);
        setIsLiked(!isLiked);
        setlikeCounts(likeCounts + 1);
      } else {
        await axios.delete(
          `https://backend.dosshs.online/api/announcement/like/${announceLikeId}`,
          {
            headers: {
              Authorization: token,
            },
          }
        );
        setLikeId(null);
        onLike(null);
        setIsLiked(!isLiked);
        setlikeCounts(likeCounts - 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLikeInProgress(false);
    }
  }

  const fetchComments = async () => {
    if (fetchedComments.length > 0) {
      setIsCommentFetching(false);
      return setComments(fetchedComments);
    }

    const commentsRes = await axios.get(
      `https://backend.dosshs.online/api/announcement/comment/c?announcementId=${announceId}`,
      {
        headers: {
          Authorization: token,
        },
      }
    );
    setIsCommentFetching(false);
    setComments(commentsRes.data.comments.reverse());
    onFetchedComments(commentsRes.data.comments.reverse());
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
      onCommentUpdate();
    } catch (err) {
      return console.error(err);
    } finally {
      setComment("");
      setCommenting(false);
      fetchComments();
    }
  };

  useEffect(() => {
    if (hasComments) fetchComments();
    else if (!hasComments) {
      setIsCommentFetching(false);
    }
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
        <div className="post-content" style={{ padding: "1rem 0 0" }}>
          <div className="contents">
            {content.split("\n").map((line, index) => (
              <p key={index} style={{ fontSize: "0.95rem" }}>
                {line}
              </p>
            ))}
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
                className={
                  isLiked
                    ? "announcement-like --isAnnouncementLiked"
                    : "announcement-like"
                }
                // style={{
                //   background-image: isLiked
                //     ? "url(../../assets/images/heart-filled.png)"
                //     : "url(../../assets/images/heart.png)",
                // }}
                onClick={handleLike}
              ></div>
              <p className="like-count">{likeCounts}</p>
            </div>
            <div className="comment-container">
              <div
                className="comment-icon"
                // onClick={() => {
                //   setIsPostOpen(!isPostOpen);
                // }}
              ></div>
              <p className="comment-count">
                {" "}
                {comments.length > 1
                  ? `${comments.length} Comments `
                  : `${comments.length} Comment`}
              </p>
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
            {isCommentFetching ? (
              <CommentSkeleton cards={1} />
            ) : (
              comments.map((comment) => (
                <Reply
                  key={comment._id}
                  commentId={comment._id}
                  userUsername={userUsername}
                  fullname={comment.fullname}
                  username={comment.username}
                  content={comment.content}
                  date={comment.dateCreated}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
