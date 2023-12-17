import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import Announce from "../../reusable-components/announcement/Announce";
import axios from "axios";
import Cookies from "js-cookie";
import PostSkeleton from "../../reusable-components/skeletonloading/PostSkeleton";
import { URL } from "../../App";
import "../dashboard/stylesheets/Home.css";

function NonAdminAnnouncement({ fullname, username, userId }) {
  const token = Cookies.get("token");
  const userUserId = Cookies.get("userId");
  const [announcements, setAnnouncements] = useState([]);
  const [postFilter, setPostFilter] = useState();
  const { ref: myRef, inView: fetchPost } = useInView();
  const [showLoading, setShowLoading] = useState(true);
  const [isCreateAnnounceOpen, setIsCreateAnnounceOpen] = useState(false);

  const fetchPosts = async () => {
    try {
      console.log(announcements);
      const announcement = await axios.get(`${URL}/announcement`, {
        headers: {
          Authorization: token,
        },
      });

      const getLikesPromises = announcement.data.map(async (announcement) => {
        const likeCountResponse = await axios.get(
          `${URL}/announcement/like/count/${announcement._id}`,
          {
            headers: {
              Authorization: token,
            },
          }
        );

        const liked = likeCountResponse.data.likes.some(
          (like) => like.userId === userUserId
        );

        const likedId = likeCountResponse.data.likes
          .filter((like) => like.userId === userUserId)
          .map((like) => like._id);

        const [likeCount] = await Promise.all([likeCountResponse]);

        const commentCountResponse = await axios.get(
          `${URL}/announcement/comment/count?announcementId=${announcement._id}`,
          {
            headers: {
              Authorization: token,
            },
          }
        );

        const [commentCount] = await Promise.all([commentCountResponse]);

        return {
          ...announcement,
          likeCount: likeCountResponse.data.likeCount,
          liked: liked,
          likeId: likedId,
          commentCount: commentCount.data.commentCount,
        };
      });

      const announcementsWithCounts = await Promise.all(getLikesPromises);
      setAnnouncements(announcementsWithCounts.reverse());
      console.log(announcements);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const handleAnnouncementCreated = () => {
    fetchPosts();
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <>
      {/* <Announcements fullname={fullname} username={username} userId={userID} />
      <Home fullname={fullname} username={username} userId={userID} /> */}

      <div className="home-container">
        <div className="filter-container">
          <span
            className={
              postFilter === undefined ? "--chip active-chip" : "--chip"
            }
            onClick={() => {
              setPostFilter();
              // console.log(postFilter);
            }}
          >
            DOS is For You!
          </span>
          <span
            className={postFilter === 0 ? "--chip active-chip" : "--chip"}
            onClick={() => {
              setPostFilter(0);
              // console.log(postFilter);
            }}
          >
            General
          </span>
          <span
            className={postFilter === 1 ? "--chip active-chip" : "--chip"}
            onClick={() => {
              setPostFilter(1);
              // console.log(postFilter);
            }}
          >
            PUP
          </span>
          <span
            className={postFilter === 2 ? "--chip active-chip" : "--chip"}
            onClick={() => {
              setPostFilter(2);
              // console.log(postFilter);
            }}
          >
            Question
          </span>
          <span
            className={postFilter === 3 ? "--chip active-chip" : "--chip"}
            onClick={() => {
              setPostFilter(3);
              // console.log(postFilter);
            }}
          >
            Rant
          </span>
          <span
            className={postFilter === 4 ? "--chip active-chip" : "--chip"}
            onClick={() => {
              setPostFilter(4);
              // console.log(postFilter);
            }}
          >
            Confession
          </span>
          <span
            className={postFilter === 5 ? "--chip active-chip" : "--chip"}
            onClick={() => {
              setPostFilter(5);
              // console.log(postFilter);
            }}
          >
            Anonymous
          </span>
        </div>
        <div className="post-container">
          <div className="create-post">
            <button
              className="post-btn"
              onClick={() => setIsCreatePostOpen(!isCreatePostOpen)}
            >
              <i className="material-icons">add_circle_outline</i> Post
              Something
            </button>
          </div>
          <div className="posts-list">
            {announcements.length === 0 ? (
              <PostSkeleton cards={2} />
            ) : (
              announcements.map((el) => (
                <Announce
                  key={el._id}
                  userUsername={username}
                  userUserId={userId}
                  userFullName={fullname}
                  announceId={el._id}
                  fullname={el.fullname}
                  username={el.username}
                  content={el.content}
                  date={el.dateCreated}
                  liked={el.liked}
                  likeCount={el.likeCount}
                  likeId={el.likeId}
                  commentCount={el.commentCount}
                />
              ))
            )}
            {/* {showLoading ? (
              <div ref={myRef}>
                <PostSkeleton cards={1} />
              </div>
            ) : null} */}
          </div>
        </div>
      </div>
    </>
  );
}

export default NonAdminAnnouncement;
