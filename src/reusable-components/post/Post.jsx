import { Link } from "react-router-dom";
import "./Post.css";

export default function Post({
  fullname,
  username,
  content,
  date,
  category,
  isAnonymous,
}) {
  const newDate = date.slice(0, 10);
  return (
    <div className="post">
      <div className="post-content-container">
        <div className="post-details">
          <div className="post-author-info">
            <div className="profile-pic"></div>
            <div className="post-author">
              <p className="display-name">
                {isAnonymous ? "Anonymous" : fullname}
              </p>
              <p className="username">
                {!isAnonymous && (
                  <Link to={`/user/${username}`}>@{username}</Link>
                )}
              </p>
              <p className="date">{newDate}</p>
            </div>
          </div>
          <div className="report-post-container"></div>
        </div>
        <div className="post-content">
          <p className="category">
            #
            {category === 0
              ? "General"
              : category === 1
              ? "PUP"
              : category === 2
              ? "Question"
              : category === 3 && "Rant"}
          </p>
          <p>{content}</p>
        </div>
      </div>
      <div className="post-interaction">{/* like and comment container */}</div>
    </div>
  );
}
