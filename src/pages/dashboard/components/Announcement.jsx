import { useEffect, useState } from "react";
import Announce from "../../../reusable-components/announcement/Announce";
import CreateAnnouncement from "../../../reusable-components/announcement/CreateAnnouncement";
import AnnouncementSkeleton from "../../../reusable-components/skeletonloading/AnnouncementSkeleton";
import "../stylesheets/Announcement.css";
import axios from "axios";
import Cookies from "js-cookie";
import { URL } from "../../../App";

export default function Announcements({ fullname, username, userId, section, admin }) {
  const token = Cookies.get("token");
  const userUserId = Cookies.get("userId");
  const [announcements, setAnnouncements] = useState([]);
  const [isCreateAnnounceOpen, setIsCreateAnnounceOpen] = useState(false);
  const [strand, setStrand] = useState();
  const [classSection, setClassSection] = useState();

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

  const setStrandandClass = () => {
    if (section === 1 || section === 2) {
      setStrand(3)
    } else if (section >= 3 && section <= 13) {
      setStrand(6)
    } else if (section >= 14 && section <= 22) {
      setStrand(18);
    } else if (section === 23 || section === 24) {
      setStrand(28);
    }

    if (section === 1) {
      setClassSection(4)
    } else if (section === 2) {
      setClassSection(5)
    } else if (section === 3) {
      setClassSection(7)
    } else if (section === 4) {
      setClassSection(8)
    } else if (section === 5) {
      setClassSection(9)
    } else if (section === 6) {
      setClassSection(10);
    } else if (section === 7) {
      setClassSection(11);
    } else if (section === 8) {
      setClassSection(12);
    } else if (section === 9) {
      setClassSection(13);
    } else if (section === 10) {
      setClassSection(14);
    } else if (section === 11) {
      setClassSection(15);
    } else if (section === 12) {
      setClassSection(16);
    } else if (section === 13) {
      setClassSection(17);
    } else if (section === 14) {
      setClassSection(19);
    } else if (section === 15) {
      setClassSection(20);
    } else if (section === 16) {
      setClassSection(21);
    } else if (section === 17) {
      setClassSection(22);
    } else if (section === 18) {
      setClassSection(23);
    } else if (section === 19) {
      setClassSection(24);
    } else if (section === 20) {
      setClassSection(25);
    } else if (section === 21) {
      setClassSection(26);
    } else if (section === 22) {
      setClassSection(27);
    } else if (section === 23) {
      setClassSection(29);
    } else if (section === 24) {
      setClassSection(30);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if(section !== 0) setStrandandClass();
  }, [section]);

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
                announcements.filter((announce) => announce.category === 0 || announce.category === 1 || announce.category === 2 || announce.category === strand || announce.category === classSection).map((el) => (
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
          section={section}
          admin={admin}
          onAnnouncementCreated={handleAnnouncementCreated}
          onModalClose={() => {
            setIsCreateAnnounceOpen(!isCreateAnnounceOpen);
          }}
          
        />
      )}
    </>
  );
}
