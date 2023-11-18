import { Link } from "react-router-dom";

export default function Announce({ fullname, username, content }) {
  return (
    <div className="post">
      <div className="post-content-container">
        <div className="post-details">
          <div className="post-author-info">
            <div className="profile-pic"></div>
            <div className="post-author">
              <p className="display-name">{fullname}</p>
              <p className="username">
                <Link to={`/user/${username}`}>@{username}</Link>
              </p>
            </div>
          </div>
          <div className="report-post-container"></div>
        </div>
        <div className="post-content --announce">
          <p>{content}</p>
        </div>
      </div>
      <div className="post-interaction">{/* like and comment container */}</div>
    </div>
  );
}
