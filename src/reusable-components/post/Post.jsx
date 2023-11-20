import { Link } from "react-router-dom";
import { useState } from "react";
import ExpandedPost from "./ExpandedPost";
import "./Post.css";
import axios from "axios";
import Cookies from "js-cookie";

export default function Post({
  userUsername,
  userUserId,
  postId,
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
  let [likeCounts, setIlikeCounts] = useState(likeCount);
  let [postLikeId, setLikeId] = useState(likeId);

  async function handleLike() {
    if (!isLiked) {
      try {
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
        setIlikeCounts((likeCounts += 1));
      } catch (err) {
        return console.error(err);
      }
    } else {
      try {
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
        setIlikeCounts((likeCounts -= 1));
      } catch (err) {
        return console.error(err);
      }
    }
  }

  const newDate = date.slice(0, 10);
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
            <p className="like-count">{likeCounts}</p>
          </div>
          <div className="comment-container">
            <div
              className="comment-icon"
              onClick={() => {
                setIsPostOpen(!isPostOpen);
              }}
            ></div>
            <p className="comment-count">{commentCount} Comments</p>
          </div>
          <div className="report-post"></div>
        </div>
      </div>
      {isPostOpen && (
        <>
          <ExpandedPost
            category={category}
            content={content}
            username={username}
            isAnonymous={isAnonymous}
            date={newDate}
            fullname={fullname}
            onCloseExpandedPost={() => {
              setIsPostOpen(!isPostOpen);
            }}
          />{" "}
          <div className="overlay"></div>
        </>
      )}
    </>
  );
}
