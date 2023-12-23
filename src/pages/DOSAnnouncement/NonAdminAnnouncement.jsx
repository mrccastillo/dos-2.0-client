import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import Announce from "../../reusable-components/announcement/Announce";
import axios from "axios";
import Cookies from "js-cookie";
import PostSkeleton from "../../reusable-components/skeletonloading/PostSkeleton";
import { URL } from "../../App";
import "../dashboard/stylesheets/Home.css";
import CreateAnnouncement from "../../reusable-components/announcement/CreateAnnouncement";

function NonAdminAnnouncement({ fullname, username, userId, section }) {
  const token = Cookies.get("token");
  const userUserId = Cookies.get("userId");
  const [announcements, setAnnouncements] = useState([]);
  const [postFilter, setPostFilter] = useState();
  const { ref: myRef, inView: fetchPost } = useInView();
  const [showLoading, setShowLoading] = useState(true);
  const [isCreateAnnounceOpen, setIsCreateAnnounceOpen] = useState(false);
  const [strandName, setStrandName] = useState("");
  const [strand, setStrand] = useState(0);
  const [className, seClassName] = useState("");
  const [classSection, setClassSection] = useState(0);

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
      setStrand(3);
      setPostFilter(3);
      setStrandName("ICT");
    } else if (section >= 3 && section <= 13) {
      setStrand(6);
      setPostFilter(6);
      setStrandName("STEM");
    } else if (section >= 14 && section <= 22) {
      setStrand(18);
      setPostFilter(18);
      setStrandName("ABM");
    } else if (section === 23 || section === 24) {
      setStrand(28);
      setPostFilter(28);
      setStrandName("HUMSS");
    }

    if (section === 1) {
      setClassSection(4);
      setPostFilter(4);
      seClassName("ICT 12 - 1");
    } else if (section === 2) {
      setClassSection(5);
      setPostFilter(5);
      seClassName("ICT 12 - 2");
    } else if (section === 3) {
      setClassSection(7);
      setPostFilter(7);
      seClassName("STEM 11 - 1");
    } else if (section === 4) {
      setClassSection(8);
      setPostFilter(8);
      seClassName("STEM 12 - 1");
    } else if (section === 5) {
      setClassSection(9);
      setPostFilter(9);
      seClassName("STEM 12 - 2");
    } else if (section === 6) {
      setClassSection(10);
      setPostFilter(10);
      seClassName("STEM 12 - 3");
    } else if (section === 7) {
      setClassSection(11);
      setPostFilter(11);
      seClassName("STEM 12 - 4");
    } else if (section === 8) {
      setClassSection(12);
      setPostFilter(12);
      seClassName("STEM 12 - 5");
    } else if (section === 9) {
      setClassSection(13);
      setPostFilter(13);
      seClassName("STEM 12 - 6");
    } else if (section === 10) {
      setClassSection(14);
      setPostFilter(14);
      seClassName("STEM 12 - 7");
    } else if (section === 11) {
      setClassSection(15);
      setPostFilter(15);
      seClassName("STEM 12 - 8");
    } else if (section === 12) {
      setClassSection(16);
      setPostFilter(16);
      seClassName("STEM 12 - 9");
    } else if (section === 13) {
      setClassSection(17);
      setPostFilter(17);
      seClassName("STEM 12 - 10");
    } else if (section === 14) {
      setClassSection(19);
      setPostFilter(19);
      seClassName("ABM 11 - 1");
    } else if (section === 15) {
      setClassSection(20);
      setPostFilter(20);
      seClassName("ABM 12 - 1");
    } else if (section === 16) {
      setClassSection(21);
      setPostFilter(21);
      seClassName("ABM 12 - 2");
    } else if (section === 17) {
      setClassSection(22);
      setPostFilter(22);
      seClassName("ABM 12 - 3");
    } else if (section === 18) {
      setClassSection(23);
      setPostFilter(23);
      seClassName("ABM 12 - 4");
    } else if (section === 19) {
      setClassSection(24);
      setPostFilter(24);
      seClassName("ABM 12 - 5");
    } else if (section === 20) {
      setClassSection(25);
      setPostFilter(25);
      seClassName("ABM 12 - 6");
    } else if (section === 21) {
      setClassSection(26);
      setPostFilter(26);
      seClassName("ABM 12 - 7");
    } else if (section === 22) {
      setClassSection(27);
      setPostFilter(27);
      seClassName("ABM 12 - 8");
    } else if (section === 23) {
      setClassSection(29);
      setPostFilter(29);
      seClassName("HUMSS 12 - 1");
    } else if (section === 24) {
      setClassSection(30);
      setPostFilter(30);
      seClassName("HUMSS 12 - 2");
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    setStrandandClass();
  }, [section]);

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
            }}
          >
            All
          </span>
          <span
            className={postFilter === 1 ? "--chip active-chip" : "--chip"}
            onClick={() => {
              setPostFilter(1);
            }}
          >
            PUP
          </span>
          <span
            className={postFilter === 2 ? "--chip active-chip" : "--chip"}
            onClick={() => {
              setPostFilter(2);
            }}
          >
            SHS
          </span>
          <span
            className={postFilter === strand ? "--chip active-chip" : "--chip"}
            onClick={() => {
              setPostFilter(strand);
            }}
          >
            {strandName}
          </span>
          <span
            className={
              postFilter === classSection ? "--chip active-chip" : "--chip"
            }
            onClick={() => {
              setPostFilter(classSection);
            }}
          >
            {className}
          </span>
        </div>
        <div className="post-container">
          <div className="create-post">
            <button
              className="post-btn"
              onClick={() => setIsCreateAnnounceOpen(!isCreateAnnounceOpen)}
            >
              <i className="material-icons">add_circle_outline</i> Make an
              Announcement
            </button>
          </div>
          <div className="posts-list">
            {announcements.length === 0 ? (
              <PostSkeleton cards={2} />
            ) : postFilter === undefined ? (
              announcements
                .filter((el) => el.category !== 0)
                .map((el) => (
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
            ) : (
              announcements
                .filter((el) => el.category === postFilter)
                .map((el) => (
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
            {/* {showLoading ? (
              <div ref={myRef}>
                <PostSkeleton cards={1} />
              </div>
            ) : null} */}
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

export default NonAdminAnnouncement;
