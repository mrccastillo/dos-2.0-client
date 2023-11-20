import { Link } from "react-router-dom";
import { useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";

export default function Announce({
  announceId,
  fullname,
  username,
  content,
  date,
  liked,
  likeCount,
  likeId,
  commentCount,
  userUserId,
  userUsername,
}) {
  const token = Cookies.get("token");
  const [isLiked, setIsLiked] = useState(liked);
  let [likeCounts, setIlikeCounts] = useState(likeCount);
  const [announceLikeId, setLikeId] = useState(likeId);
  const [likeInProgress, setLikeInProgress] = useState(false);

  async function handleLike() {
    if (likeInProgress) return;
    setLikeInProgress(true);
    try {
      if (!isLiked) {
        const likeAnnounce = {
          announcementId: announceId,
          userId: userUserId,
          username: userUsername,
        };

        const likeRes = await axios.post(
          "https://backend.dosshs.online/api/announcement/like",
          likeAnnounce,
          {
            headers: {
              Authorization: token,
            },
          }
        );
        setLikeId(likeRes.data.like._id);
        setIsLiked(!isLiked);
        setIlikeCounts((likeCounts += 1));
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
        setIsLiked(!isLiked);
        setIlikeCounts((likeCounts -= 1));
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
              isLiked
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
            {likeCounts}
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
            {commentCount} Comments
          </p>
        </div>
      </div>
      <div className="date announcement-date">{formatDate(date)}</div>
    </div>
  );
}
