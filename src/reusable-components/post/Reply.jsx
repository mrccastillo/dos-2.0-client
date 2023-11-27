import { useEffect, useState } from "react";
import CommentsReply from "./CommentsReply";
import "./Reply.css";
import Cookies from "js-cookie";
import axios from "axios";
import { URL } from "../../App";

export default function Reply({
  fullname,
  username,
  content,
  date,
  commentId,
  userUsername,
  userFullName,
  isPost,
}) {
  const token = Cookies.get("token");
  const userId = Cookies.get("userId");
  const [likeId, setLikeId] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [replies, setReplies] = useState([]);
  const [replyCount, setReplyCount] = useState(replies.length);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [likeInProgress, setLikeInProgress] = useState(false);
  const [isCommentReplyOpen, setIsCommentReplyOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);

  const toggleReadMore = () => {
    setIsCollapsed(!isCollapsed);
  };

  const formatDate = (inputDate) => {
    const postDate = new Date(inputDate);
    const currentDate = new Date();
    const timeDifference = Math.abs(currentDate - postDate) / 1000;

    const timeIntervals = {
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    let timeAgo = Math.floor(timeDifference);
    let timeUnit = "";

    for (let interval in timeIntervals) {
      if (timeAgo >= timeIntervals[interval]) {
        timeUnit = interval;
        timeAgo = Math.floor(timeAgo / timeIntervals[interval]);
        break;
      }
    }

    if (timeUnit === "day" && timeAgo >= 1) {
      if (timeAgo === 1) {
        const options = {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        };
        return `Yesterday at ${postDate.toLocaleTimeString(
          undefined,
          options
        )}`;
      } else {
        const options = {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        };
        return postDate.toLocaleString(undefined, options);
      }
    }

    if (timeUnit === "") {
      return "Just now";
    }

    return `${timeAgo} ${timeUnit}${timeAgo > 1 ? "s" : ""} ago`;
  };

  const fetchReplies = async () => {
    try {
      const query = isPost ? "postCommentId" : "announcementCommentId";
      const path = isPost ? "post" : "announcement";

      const commentsRes = await axios.get(
        `${URL}/${path}/comment/c?${query}=${commentId}`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      setReplies(commentsRes.data.comments.reverse());
      setReplyCount(commentsRes.data.comments.length);
    } catch (err) {
      return console.error(err);
    }
  };

  const fetchLikes = async () => {
    try {
      const likes = await axios.get(`${URL}/comment?commentId=${commentId}`, {
        headers: {
          Authorization: token,
        },
      });
      setLikeCount(likes.data.likeCount);
      const liked = likes.data.likes.some((like) => like.userId === userId);

      const LikeID = likes.data.likes
        .filter((like) => like.userId === userId)
        .map((like) => like._id);

      setIsLiked(liked);
      setLikeId(LikeID);
    } catch (err) {
      return console.error(err);
    }
  };

  async function handleLike() {
    if (likeInProgress) return;

    setLikeInProgress(true);

    try {
      if (!isLiked) {
        const likePost = {
          commentId: commentId,
          userId: userId,
          username: userUsername,
        };
        const likeRes = await axios.post(`${URL}/comment`, likePost, {
          headers: {
            Authorization: token,
          },
        });
        setLikeId(likeRes.data.like._id);
        setIsLiked(!isLiked);
        setLikeCount(likeCount + 1);
      } else {
        await axios.delete(`${URL}/comment?likeId=${likeId}`, {
          headers: {
            Authorization: token,
          },
        });
        setLikeId(null);
        setIsLiked(!isLiked);
        setLikeCount(likeCount - 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLikeInProgress(false);
    }
  }

  const submitReply = async () => {
    if (replying) return;
    if (!reply) return;

    const trimmedReply = reply.trim();
    const validatedReply = trimmedReply.replace(/\u2800/g, "");
    if (!validatedReply) {
      return;
    }

    setReplying(true);

    const commentObj = {
      profilePicture: "",
      userId: userId,
      fullname: userFullName,
      username: userUsername,
      content: reply,
    };

    if (isPost) commentObj.postCommentId = commentId;
    else commentObj.announcementCommentId = commentId;

    const path = isPost ? "post" : "announcement";

    try {
      const res = await axios.post(`${URL}/${path}/comment`, commentObj, {
        headers: {
          Authorization: token,
        },
      });

      setReplies((prev) => [res.data.comment, ...prev]);
    } catch (err) {
      return console.error(err);
    } finally {
      setReply("");
      setReplying(false);
    }
  };

  useEffect(() => {
    fetchLikes();
    fetchReplies();
  }, []);

  useEffect(() => {
    setReplyCount(replies.length);
  }, [replies]);

  return (
    <>
      <div className="reply">
        <div className="post-header">
          <div
            className="profile-pic"
            //   style={{ width: "3.5rem", height: "3.5rem" }}
          ></div>
          <div className="post-author">
            <p className="display-name">
              {/*isAnonymous ? "Anonymous" : fullname*/}
              {fullname}
            </p>
            <p className="username">
              {/* {!isAnonymous && <Link to={`/${username}`}>@{username}</Link>} */}
              @{username}
            </p>
            <p
              className="date"
              style={{
                position: "absolute",
                top: "1.5rem",
                right: "1rem",
              }}
            >
              {formatDate(date)}
            </p>
          </div>
        </div>{" "}
        {/* {content.split("\n").map((line, index) => (
        <p
          key={index}
          style={{
            fontSize: "0.85rem",
            marginTop: "0.1rem",
            marginLeft: "3.5rem",
          }}
        >
          {line}
        </p>
      ))} */}
        {content.split("\n").map((line, index) => (
          <p
            key={index}
            style={{
              fontSize: "0.85rem",
              marginTop: "0.1rem",
              marginLeft: "3.5rem",
            }}
          >
            {isCollapsed ? line.slice(0, 120) : line}
          </p>
        ))}
        {content.length > 120 && (
          <p
            className="read-more"
            style={{ marginLeft: "3.5rem" }}
            onClick={toggleReadMore}
          >
            {isCollapsed ? "...read more" : "...show less"}
          </p>
        )}
        <div
          className="post-interaction"
          style={{
            padding: "1.5rem 2.5rem",
          }}
        >
          <div className="like-container">
            <div
              className={isLiked ? "like-icon --isLiked" : "like-icon"}
              onClick={handleLike}
            ></div>
            {likeCount}
          </div>
          <div className="comment-container">
            <div
              className="comment-icon"
              onClick={() => {
                setIsCommentReplyOpen(!isCommentReplyOpen);
              }}
            ></div>
            {replyCount} Replies
          </div>
        </div>
        {isCommentReplyOpen && (
          <div className="reply-to-post" style={{ height: "5rem" }}>
            <div className="user-reply">
              <div className="profile-pic"></div>
              <textarea
                placeholder="Post your reply"
                className="reply-textarea"
                value={reply}
                onChange={(e) => {
                  setReply(e.target.value);
                }}
              ></textarea>
            </div>
            <button className="reply-btn" onClick={submitReply}>
              Reply
            </button>
          </div>
        )}
        {isCommentReplyOpen && (
          <>
            {replies.map((el) => (
              <CommentsReply
                key={el._id}
                commentId={el._id}
                fullname={el.fullname}
                username={el.username}
                content={el.content}
                date={el.dateCreated}
                userUsername={userUsername}
              />
            ))}
            {/* <CommentsReply />
            <CommentsReply /> */}
          </>
        )}
      </div>
    </>
  );
}
