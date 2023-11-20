import "./Reply.css";
export default function Reply({ fullname, username, content }) {
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
          {/* <p className="date">{date}</p> */}
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
