import "./Reply.css";
export default function Reply({ fullname, username, content, date }) {
  const formatDate = (inputDate) => {
    const postDate = new Date(inputDate);
    const currentDate = new Date();
    const timeDifference = Math.abs(currentDate - postDate) / 1000;

    const timeIntervals = {
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    let timeAgo = Math.floor(timeDifference);
    let timeUnit = "";

    for (let interval in timeIntervals) {
      if (timeAgo >= timeIntervals[interval]) {
        timeUnit = interval;
        timeAgo = Math.floor(timeAgo / timeIntervals[interval]);
        break;
      }
    }

    if (timeUnit === "day" && timeAgo >= 1) {
      if (timeAgo === 1) {
        const options = {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        };
        return `Yesterday at ${postDate.toLocaleTimeString(
          undefined,
          options
        )}`;
      } else {
        const options = {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        };
        return postDate.toLocaleString(undefined, options);
      }
    }

    if (timeUnit === "") {
      return "Just now";
    }

    return `${timeAgo} ${timeUnit}${timeAgo > 1 ? "s" : ""} ago`;
  };

  return (
    <div className="reply">
      <div className="post-header">
        <div
          className="profile-pic"
          //   style={{ width: "3.5rem", height: "3.5rem" }}
        ></div>
        <div className="post-author">
          <p className="display-name">
            {/*isAnonymous ? "Anonymous" : fullname*/}
            {fullname}
          </p>
          <p className="username">
            {/* {!isAnonymous && <Link to={`/${username}`}>@{username}</Link>} */}
            @{username}
          </p>
          <p className="date">{formatDate(date)}</p>
        </div>
      </div>
      <p
        style={{
          fontSize: "0.85rem",
          marginTop: "0.1rem",
          marginLeft: "3.5rem",
        }}
      >
        {content}
      </p>
      <div
        className="post-interaction"
        style={{
          //   borderBottom: " 1px solid rgb(93, 93, 93)",
          padding: "1.5rem 2.5rem",
        }}
      >
        {/*<div className="like-container">
          <div
            className={/*isLiked ? "like-icon --isLiked" :  "like-icon"}
            // style={{
            //   background-image: isLiked
            //     ? "url(../../assets/images/heart-filled.png)"
            //     : "url(../../assets/images/heart.png)",
            // }}
            // onClick={handleLike}
          ></div>
        </div>
        <div className="comment-container">
          <div
            className="comment-icon"
            // onClick={() => {
            //   setIsPostOpen(!isPostOpen);
            // }}
      ></div>
        </div>*/}
      </div>
    </div>
  );
}
