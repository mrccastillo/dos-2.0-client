import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import ExpandedPost from "./ExpandedPost";
import "./Post.css";
import axios from "axios";
import Cookies from "js-cookie";

export default function Post({
  postId,
  userUsername,
  userUserId,
  userFullName,
  fullname,
  username,
  content,
  date,
  category,
  isAnonymous,
  liked,
  likeCount,
  likeId,
  commentCount,
}) {
  const token = Cookies.get("token");
  const [isLiked, setIsLiked] = useState(liked);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [likeCounts, setlikeCounts] = useState(likeCount);
  const [commentCounts, setCommentCount] = useState(commentCount);
  const [postLikeId, setLikeId] = useState(likeId);
  const [likeInProgress, setLikeInProgress] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [hasComments, setHasComments] = useState(false);

  const toggleReadMore = () => {
    setIsCollapsed(!isCollapsed);
  };

  async function handleLike() {
    if (likeInProgress) return;

    setLikeInProgress(true);

    try {
      if (!isLiked) {
        const likePost = {
          postId: postId,
          userId: userUserId,
          username: userUsername,
        };
        const likeRes = await axios.post(
          "https://backend.dosshs.online/api/post/like",
          likePost,
          {
            headers: {
              Authorization: token,
            },
          }
        );
        setLikeId(likeRes.data.like._id);
        setIsLiked(!isLiked);
        setlikeCounts(likeCounts + 1);
      } else {
        await axios.delete(
          `https://backend.dosshs.online/api/post/like/${postLikeId}`,
          {
            headers: {
              Authorization: token,
            },
          }
        );
        setLikeId(null);
        setIsLiked(!isLiked);
        setlikeCounts(likeCounts - 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLikeInProgress(false);
    }
  }

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

  useEffect(() => {
    if (commentCount > 0) setHasComments(true);
  });

  return (
    <>
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
                    {!isAnonymous && (
                      <Link to={`/${username}`}>@{username}</Link>
                    )}
                  </p>
                  <p className="date">{formatDate(date)}</p>
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
                : category === 3
                ? "Rant"
                : category === 4 && "Confession"}
            </p>
            {content.split("\n").map((line, index) => (
              <p key={index} style={{ fontSize: "0.95rem" }}>
                {isCollapsed ? line.slice(0, 120) : line}
              </p>
            ))}
            {content.length > 120 && (
              <p className="read-more" onClick={toggleReadMore}>
                {isCollapsed ? "...read more" : "...show less"}
              </p>
            )}
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
            <p className="like-count">{likeCounts}</p>
          </div>
          <div className="comment-container">
            <div
              className="comment-icon"
              onClick={() => {
                setIsPostOpen(!isPostOpen);
              }}
            ></div>
            <p className="comment-count">{commentCounts} Comments</p>
          </div>
          <div className="report-post"></div>
        </div>
      </div>
      {isPostOpen && (
        <>
          <ExpandedPost
            token={token}
            postId={postId}
            userUserId={userUserId}
            userUsername={userUsername}
            userFullName={userFullName}
            category={category}
            content={content}
            username={username}
            isAnonymous={isAnonymous}
            date={formatDate(date)}
            fullname={fullname}
            onCloseExpandedPost={() => {
              setIsPostOpen(!isPostOpen);
            }}
            liked={isLiked}
            likeId={postLikeId}
            likeCount={likeCounts}
            onLike={(likeId) => {
              setIsLiked(!isLiked);
              isLiked
                ? setlikeCounts(likeCounts - 1)
                : setlikeCounts(likeCounts + 1);
              setLikeId(likeId);
            }}
            onCommentUpdate={() => {
              setCommentCount(commentCounts + 1);
            }}
            hasComments={hasComments}
          />{" "}
          <div className="overlay"></div>
        </>
      )}
    </>
  );
}
