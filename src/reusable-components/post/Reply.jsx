import { useEffect, useState } from "react";
import "./Reply.css";
import Cookies from "js-cookie";
import axios from "axios";

export default function Reply({
  fullname,
  username,
  content,
  date,
  commentId,
  userUsername,
}) {
  const token = Cookies.get("token");
  const userId = Cookies.get("userId");
  const [likeId, setLikeId] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [replyCount, setReplyCount] = useState(0);

  const [likeInProgress, setLikeInProgress] = useState(false);
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

  const fetchLikes = async () => {
    try {
      const likes = await axios.get(
        `https://backend.dosshs.online/api/comment?commentId=${commentId}`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
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
        const likeRes = await axios.post(
          "https://backend.dosshs.online/api/comment",
          likePost,
          {
            headers: {
              Authorization: token,
            },
          }
        );
        setLikeId(likeRes.data.like._id);
        setIsLiked(!isLiked);
        setLikeCount(likeCount + 1);
      } else {
        await axios.delete(
          `https://backend.dosshs.online/api/comment?likeId=${likeId}`,
          {
            headers: {
              Authorization: token,
            },
          }
        );
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

  useEffect(() => {
    fetchLikes();
  }, []);

  return (
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
          <p className="date">{formatDate(date)}</p>
        </div>
      </div>{" "}
      {content.split("\n").map((line, index) => (
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
      ))}
      <div
        className="post-interaction"
        style={{
          //   borderBottom: " 1px solid rgb(93, 93, 93)",
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
            // onClick={() => {
            //   setIsPostOpen(!isPostOpen);
            // }}
          ></div>
          {replyCount} Replies
        </div>
      </div>
      {/* <Reply /> */}
    </div>
  );
}
