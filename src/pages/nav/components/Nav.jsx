import { Link } from "react-router-dom";
import "../stylesheets/Nav.css";
import { useEffect, useState } from "react";
import EditUserInfo from "../../../reusable-components/edituser/EditUserInfo";
import Cookies from "js-cookie";
import axios from "axios";

export default function Nav({ user, email, bio, fullname }) {
  const token = Cookies.get("token");
  const [isNavLinkOpen, setIsNavLinkOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const logOut = async () => {
    try {
      const res = await axios.post(
        `https://backend.dosshs.online/api/auth/logout?token=${token}`
      );

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
            <div className="logo"></div>
            <div className="navlinks-container">
              <p className="navlink bell-icon"></p>
              <p className="navlink announcement-icon"></p>
              <Link
                to="/"
                style={{ textDecoration: "none" }}
                className="navlink home-icon"
              ></Link>
              <p
                className="navlink settings-icon"
                onClick={() => {
                  setIsSettingsOpen(!isSettingsOpen);
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

              <p className="link">Account Settings</p>
              <p className="link">Support Devs</p>
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
      {isSettingsOpen && (
        <EditUserInfo
          fullname={fullname}
          username={user}
          bio={bio}
          email={email}
          onCloseSettings={() => {
            setIsSettingsOpen(!isSettingsOpen);
          }}
        />
      )}

      {(isNavLinkOpen || isSettingsOpen) && <div className="overlay"></div>}
    </>
  );
}
