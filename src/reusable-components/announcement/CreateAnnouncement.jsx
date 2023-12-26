import { useState, useEffect } from "react";
import axios from "axios";
import "./CreateAnnouncement.css";
import Cookies from "js-cookie";
import { URL } from "../../App";

export default function CreateAnnouncement({
  fullname,
  username,
  userId,
  section,
  admin,
  onAnnouncementCreated,
  onModalClose,
}) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(4);
  const [isCreatingAnnouncement, setIsCreatingAnnouncement] =
    useState("Announce");
  const [announcing, setAnnouncing] = useState(false);
  const [strandName, setStrandName] = useState("");
  const [strand, setStrand] = useState();
  const [className, seClassName] = useState("");
  const [classSection, setClassSection] = useState();

  const setStrandandClass = () => {
    if (section === 1 || section === 2) {
      setStrand(3)
      setStrandName("ICT");
    } else if (section >= 3 && section <= 13) {
      setStrand(6)
      setStrandName("STEM");
    } else if (section >= 14 && section <= 22) {
      setStrand(18);
      setStrandName("ABM");
    } else if (section === 23 || section === 24) {
      setStrand(28);
      setStrandName("HUMSS");
    }

    if (section === 1) {
      setClassSection(4)
      seClassName("ICT 12 - 1");
    } else if (section === 2) {
      setClassSection(5)
      seClassName("ICT 12 - 2");
    } else if (section === 3) {
      setClassSection(7)
      seClassName("STEM 11 - 1");
    } else if (section === 4) {
      setClassSection(8)
      seClassName("STEM 12 - 1");
    } else if (section === 5) {
      setClassSection(9)
      seClassName("STEM 12 - 2");
    } else if (section === 6) {
      setClassSection(10);
      seClassName("STEM 12 - 3");
    } else if (section === 7) {
      setClassSection(11);
      seClassName("STEM 12 - 4");
    } else if (section === 8) {
      setClassSection(12);
      seClassName("STEM 12 - 5");
    } else if (section === 9) {
      setClassSection(13);
      seClassName("STEM 12 - 6");
    } else if (section === 10) {
      setClassSection(14);
      seClassName("STEM 12 - 7");
    } else if (section === 11) {
      setClassSection(15);
      seClassName("STEM 12 - 8");
    } else if (section === 12) {
      setClassSection(16);
      seClassName("STEM 12 - 9");
    } else if (section === 13) {
      setClassSection(17);
      seClassName("STEM 12 - 10");
    } else if (section === 14) {
      setClassSection(19);
      seClassName("ABM 11 - 1");
    } else if (section === 15) {
      setClassSection(20);
      seClassName("ABM 12 - 1");
    } else if (section === 16) {
      setClassSection(21);
      seClassName("ABM 12 - 2");
    } else if (section === 17) {
      setClassSection(22);
      seClassName("ABM 12 - 3");
    } else if (section === 18) {
      setClassSection(23);
      seClassName("ABM 12 - 4");
    } else if (section === 19) {
      setClassSection(24);
      seClassName("ABM 12 - 5");
    } else if (section === 20) {
      setClassSection(25);
      seClassName("ABM 12 - 6");
    } else if (section === 21) {
      setClassSection(26);
      seClassName("ABM 12 - 7");
    } else if (section === 22) {
      setClassSection(27);
      seClassName("ABM 12 - 8");
    } else if (section === 23) {
      setClassSection(29);
      seClassName("HUMSS 12 - 1");
    } else if (section === 24) {
      setClassSection(30);
      seClassName("HUMSS 12 - 2");
    }
  };

  useEffect(() => {
    if(section !== 0) setStrandandClass();
  }, [section]);

  async function handleAnnouncementSubmit(e) {
    e.preventDefault();
    if (announcing) return;
    if (!content) return;

    const trimmedAnnouncement = content.trim();
    const validatedAnnouncement = trimmedAnnouncement.replace(/\u2800/g, "");
    if (!validatedAnnouncement) {
      return;
    }

    setAnnouncing(true);
    setIsCreatingAnnouncement("Announce");

    const announce = {
      userId: userId,
      username: username,
      fullname: fullname,
      content: content,
      category: category,
    };

    try {
      setIsCreatingAnnouncement("Posting your Announcement...");
      const token = Cookies.get("token");
      await axios.post(`${URL}/announcement`, announce, {
        headers: {
          Authorization: token,
        },
      });
      onModalClose();
      onAnnouncementCreated();
    } catch (e) {
      console.error("error:", e);
    } finally {
      setAnnouncing(false);
    }
  }

  function closeModal() {
    onModalClose();
  }

  return (
    <>
      <form
        className="create-post-announcement-modal"
        onSubmit={handleAnnouncementSubmit}
      >
        <div>
          <div className="post-announcement-modal-header">
            <h2>Create Announcement</h2>
          </div>
          <div className="post-announcement-modal-content">
            <div className="post-author-info">
              <div className="post-header">
                <div className="profile-pic"></div>
                <div className="post-author">
                  <p
                    className="display-name --white-text"
                    style={{ fontWeight: 500 }}
                  >
                    {fullname}
                  </p>
                  <p className="username --white-text">@{username}</p>
                </div>
              </div>
            </div>
            <textarea
              className="create-post-announce-content"
              placeholder="What would you like to Announce?"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
              }}
            ></textarea>
            <div className="post-category">
              <select
                className="select"
                onClick={(e) => {
                  setCategory(e.target.value);
                }}
              >
                {admin ? <option value="0">DOS</option> : null}
                <option value="1">PUP</option>
                <option value="2">SHS</option>
                {strand ? <option value={strand}>{strandName}</option> : null}
                {classSection ? <option value={classSection}>{className}</option> : null}
              </select>
            </div>
          </div>
        </div>
        <div className="btn-container">
          <button className="submit-post">{isCreatingAnnouncement}</button>
        </div>
        <p className="close-btn" onClick={closeModal}>
          &times;
        </p>
      </form>
      <div className="overlay"></div>
    </>
  );
}
