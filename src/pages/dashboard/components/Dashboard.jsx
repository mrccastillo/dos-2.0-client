import Nav from "../../nav/components/Nav";
import Announcements from "./Announcement";
import DosAnnouncement from "../../DOSAnnouncement/DosAnnouncement";
import Home from "./Home";
import "../stylesheets/Dashboard.css";
import { useState, useEffect } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function Dashboard({ user }) {
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
            {width > 700 ? (
              <>
                <Announcements
                  fullname={user.fullname}
                  username={user.username}
                  userId={user._id}
                />
                <Home
                  fullname={user.fullname}
                  username={user.username}
                  userId={user._id}
                />
              </>
            ) : (
              <Home
                fullname={user.fullname}
                username={user.username}
                userId={user._id}
              />
            )}

            {/* <DosAnnouncement
              fullname={user.fullname}
              username={user.username}
              userId={user._id}
            /> */}
          </div>
        </div>
      </div>
    </HelmetProvider>
  );
}
