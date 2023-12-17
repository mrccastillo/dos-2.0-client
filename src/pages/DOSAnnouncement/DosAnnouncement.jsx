import NonAdminAnnouncement from "./NonAdminAnnouncement";
import AdminAnnouncement from "./AdminAnnouncement";
import Nav from "../nav/components/Nav";
import { Link } from "react-router-dom";
import "../dashboard/stylesheets/Home.css";
import "../dashboard/stylesheets/Announcement.css";
import "../dashboard/stylesheets/Dashboard.css";

function DosAnnouncement({ user }) {
  // const token = Cookies.get("token");
  // const userUserId = Cookies.get("userId");
  return (
    <>
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
              <h2 className="--big-h2">Announcements</h2>
            </div>
            <h2 className="--big-h2">
              Hello,{" "}
              <Link to={`/${user.username}`} className="--highlight">
                {user.username}!
              </Link>
            </h2>
          </div>
          <div className="posts-announcements-container">
            <AdminAnnouncement
              fullname={user.fullname}
              username={user.username}
              userId={user._id}
            />
            <NonAdminAnnouncement
              fullname={user.fullname}
              username={user.username}
              userId={user._id}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default DosAnnouncement;
