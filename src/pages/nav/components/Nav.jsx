import { Link } from "react-router-dom";
import "../stylesheets/Nav.css";
import { useEffect, useState } from "react";
import EditUserInfo from "../../../reusable-components/edituser/EditUserInfo";
import Feedback from "../../../reusable-components/feedback/Feedback";
import SupportUs from "../../../reusable-components/supportdos/SupportUs";
import SendNotif from "../../../reusable-components/sendNotif/sendNotif";
import FeatureNotAvail from "../../../reusable-components/announcement/featurenotavail/FeatureNotAvail";
import Cookies from "js-cookie";
import axios from "axios";
import { URL } from "../../../App";

export default function Nav({
  user,
  email,
  bio,
  firstname,
  lastname,
  fullname,
}) {
  const token = Cookies.get("token");
  const userId = Cookies.get("userId");
  const [isNavLinkOpen, setIsNavLinkOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isNotAvail, setIsNotAvail] = useState(false);
  const [isSupportDevsOpen, setIsSupportDevsOpen] = useState(false);

  const handleCloseNotAvail = () => {
    setIsNotAvail(false);
  };

  const handleOpenNotAvail = () => {
    setIsNotAvail(true);
  };

  const logOut = async () => {
    try {
      const res = await axios.post(`${URL}/auth/logout?token=${token}`);

      if (res.data.message === "Logged Out Successfully") {
        Cookies.remove("token");
        Cookies.remove("username");
        Cookies.remove("userId");
        localStorage.removeItem("firstLoad");
        location.href = "/";
      }
    } catch (err) {
      return console.error(err);
    }
  };

  useEffect(() => {
    // console.log(user);
    if (window.localStorage) {
      if (!localStorage.getItem("firstLoad")) {
        localStorage["firstLoad"] = true;
        window.location.reload();
      }
    }
  }, []);

  return (
    <>
      <nav className="nav">
        <div className="nav-content-container">
          <div className="logo-navlinks">
            <Link
              to="/home"
              style={{ textDecoration: "none" }}
              className="logo"
            ></Link>
            <div className="navlinks-container">
              <p className="navlink bell-icon" onClick={handleOpenNotAvail}></p>
              <Link
                to="/dosannouncement"
                className="navlink announcement-icon"
                onClick={handleOpenNotAvail}
              ></Link>
              <Link
                to="/home"
                style={{ textDecoration: "none" }}
                className="navlink home-icon"
              ></Link>
              <p
                className="navlink feedback-icon"
                onClick={() => {
                  setIsFeedbackOpen(!isFeedbackOpen);
                }}
              ></p>
            </div>
          </div>
          <div
            className={
              isNavLinkOpen
                ? "nav-profile-and-links-container navlink-active"
                : "nav-profile-and-links-container"
            }
            style={{ zIndex: isNavLinkOpen ? 2 : "auto" }}
          >
            <div className={isNavLinkOpen ? "links-active" : "links"}>
              {user ? (
                <Link to={`/${user}`} className="link">
                  Profile
                </Link>
              ) : (
                <Link to={null}>Profile</Link>
              )}
              <p
                className="link"
                onClick={() => {
                  setIsNavLinkOpen(!isNavLinkOpen);
                  setIsSettingsOpen(!isSettingsOpen);
                }}
              >
                Account Settings
              </p>
              <p
                className="link"
                onClick={() => {
                  setIsSupportDevsOpen(!isSupportDevsOpen);
                  setIsNavLinkOpen(!isNavLinkOpen);
                }}
              >
                Support DOS
              </p>
              <Link to="/" onClick={logOut} className="link --logout">
                Log Out
              </Link>
            </div>

            <div
              className="profile-pic --nav-profile"
              style={{ backgroundColor: isNavLinkOpen && "#fff" }}
              onClick={() => {
                setIsNavLinkOpen(!isNavLinkOpen);
              }}
            ></div>
          </div>
        </div>
      </nav>
      {isSupportDevsOpen && (
        <SupportUs
          onCloseModal={() => {
            setIsSupportDevsOpen(false);
          }}
        />
      )}
      {/* <SendNotif /> */}
      {isNotAvail && <FeatureNotAvail onCloseModal={handleCloseNotAvail} />}
      {isSettingsOpen && (
        <EditUserInfo
          fullname={fullname}
          firstname={firstname}
          lastname={lastname}
          username={user}
          bio={bio}
          email={email}
          onCloseSettings={() => {
            setIsSettingsOpen(!isSettingsOpen);
          }}
        />
      )}
      {isFeedbackOpen && (
        <Feedback
          fullname={fullname}
          username={user}
          userId={userId}
          onModalClose={() => {
            setIsCreatePostOpen(!isCreatePostOpen);
          }}
          onCloseFeedback={() => {
            setIsFeedbackOpen(!isFeedbackOpen);
          }}
        />
      )}

      {(isNavLinkOpen || isSettingsOpen || isSupportDevsOpen || isNotAvail) && (
        <div className="overlay"></div>
      )}
    </>
  );
}
