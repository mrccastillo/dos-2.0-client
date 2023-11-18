import { useEffect, useState } from "react";
import Announce from "../../../reusable-components/announcement/Announce";
import CreateAnnouncement from "../../../reusable-components/announcement/CreateAnnouncement";
import "../stylesheets/Announcement.css";
import axios from "axios";

export default function Announcements({ fullname, username, userId }) {
  const [announcements, setAnnouncements] = useState([]);
  const [isCreateAnnounceOpen, setIsCreateAnnounceOpen] = useState(false);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("token");
      const announcement = await axios.get(
        "https://backend.dosshs.online/api/announcement",
        {
          headers: {
            Authorization: token,
          },
        }
      );

      setAnnouncements(announcement.data.reverse());
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
              {announcements.map((el) => (
                <Announce
                  key={el._id}
                  fullname={el.fullname}
                  username={el.username}
                  content={el.content}
                />
              ))}
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
