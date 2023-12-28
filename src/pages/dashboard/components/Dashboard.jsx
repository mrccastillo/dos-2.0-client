import Nav from "../../nav/components/Nav";
import Announcements from "./Announcement";
import NonAdminAnnouncement from "../../DOSAnnouncement/NonAdminAnnouncement";
import AdminAnnouncement from "../../DOSAnnouncement/AdminAnnouncement";
import Home from "./Home";
import "../stylesheets/Dashboard.css";
import { useState, useEffect } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function Dashboard({ user }) {
  const [homepageFilter, setHomepageFilter] = useState(1);
  let width = window.innerWidth;

  useEffect(() => {
    if (window.localStorage) {
      if (!localStorage.getItem("firstLoad")) {
        localStorage["firstLoad"] = true;
        window.location.reload();
      }
    }
    localStorage.removeItem("isInSignInPage");
  }, []);

  return (
    <HelmetProvider>
      <Helmet>
        <title>DOSBoard</title>
        <meta property="og:title" content={`${user.fullname}`} />
      </Helmet>

      <div className="container">
        <Nav
          user={user.username}
          email={user.email}
          bio={user.bio}
          firstname={user.firstname}
          lastname={user.lastname}
          fullname={user.fullname}
        />
        <div className="dashboard">
          <div className="header">
            <div className="dosboard-and-search-container">
              <h2 className="--big-h2">DOSBoard</h2>
            </div>
            <h2 className="--big-h2">
              Hello,{" "}
              <Link to={`/${user.username}`} className="--highlight">
                {user.username}!
              </Link>
            </h2>
          </div>
          <div className="posts-announcements-container">
            {width < 700 && (
              <div
                style={{
                  width: "100%",
                  height: "4rem",
                  padding: "0.5rem 0",
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <span
                  className={
                    homepageFilter === 2 ? "--chip active-chip" : "--chip"
                  }
                  onClick={() => {
                    setHomepageFilter(2);
                  }}
                  style={{ paddingTop: "0.9rem", flex: 1 }}
                >
                  Announcement
                </span>
                <span
                  className={
                    homepageFilter === 1 ? "--chip active-chip" : "--chip"
                  }
                  onClick={() => {
                    setHomepageFilter(1);
                  }}
                  style={{ paddingTop: "0.9rem", flex: 1 }}
                >
                  Post
                </span>
              </div>
            )}
            {width > 700 ? (
              <>
                <Announcements
                  fullname={user.fullname}
                  username={user.username}
                  userId={user._id}
                  section={user.section}
                  admin={user.isAdmin}
                />
                <Home
                  fullname={user.fullname}
                  username={user.username}
                  userId={user._id}
                />
              </>
            ) : (
              <>
                {homepageFilter === 1 ? (
                  <Home
                    fullname={user.fullname}
                    username={user.username}
                    userId={user._id}
                  />
                ) : (
                  <>
                    <NonAdminAnnouncement
                      fullname={user.fullname}
                      username={user.username}
                      userId={user._id}
                      section={user.section}
                      admin={user.isAdmin}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </HelmetProvider>
  );
}
