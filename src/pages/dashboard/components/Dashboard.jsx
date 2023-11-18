import Nav from "../../nav/components/Nav";
import Announcements from "./Announcement";
import Home from "./Home";
import "../stylesheets/Dashboard.css";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";

export default function Dashboard({ user, onDecodeUser }) {
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
    <div className="container">
      <Nav user={user.username} onDecodeUser={onDecodeUser} />
      <div className="dashboard">
        <div className="header">
          <div className="dosboard-and-search-container">
            <h2 className="--big-h2">DOSBoard</h2>
          </div>
          <h2 className="--big-h2">
            Hello, <span className="--highlight">{user.username}!</span>
          </h2>
        </div>
        <div className="posts-announcements-container">
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
        </div>
      </div>
    </div>
  );
}
