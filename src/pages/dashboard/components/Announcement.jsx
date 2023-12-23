import { useEffect, useState } from "react";
import Announce from "../../../reusable-components/announcement/Announce";
import CreateAnnouncement from "../../../reusable-components/announcement/CreateAnnouncement";
import AnnouncementSkeleton from "../../../reusable-components/skeletonloading/AnnouncementSkeleton";
import "../stylesheets/Announcement.css";
import axios from "axios";
import Cookies from "js-cookie";
import { URL } from "../../../App";

export default function Announcements({ fullname, username, userId }) {
  const token = Cookies.get("token");
  const userUserId = Cookies.get("userId");
  const [announcements, setAnnouncements] = useState([]);
  const [isCreateAnnounceOpen, setIsCreateAnnounceOpen] = useState(false);

  const fetchPosts = async () => {
    try {
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
      <div className="announcement-container">
        <div className="announcement-tab">
          <div className="announcement-header">
            <p
              className="announcement-header-text --chip --announce-btn"
              style={{ cursor: "auto" }}
            >
              Announcements
            </p>
            {/* ung tatlong tuldok ewan ko kung ano to */}
          </div>
          <div className="announcements">
            <div className="create-announcement">
              <button
                className="post-btn"
                onClick={() => setIsCreateAnnounceOpen(!isCreateAnnounceOpen)}
              >
                <i className=" material-icons">add_circle_outline</i>
                Make an Announcement
              </button>
            </div>
            <div className="announcement-list">
              {announcements.length === 0 ? (
                <AnnouncementSkeleton cards={2} />
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
                    isInDosAnnounce={true}
                    category={el.category}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {isCreateAnnounceOpen && (
        <CreateAnnouncement
          fullname={fullname}
          username={username}
          userId={userId}
          onAnnouncementCreated={handleAnnouncementCreated}
          onModalClose={() => {
            setIsCreateAnnounceOpen(!isCreateAnnounceOpen);
          }}
        />
      )}
    </>
  );
}
