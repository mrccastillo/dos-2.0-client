function CommentsReply() {
  return (
    <div className="reply" style={{ marginTop: "1rem" }}>
      <div className="post-header">
        <div
          className="profile-pic"
          //   style={{ width: "3.5rem", height: "3.5rem" }}
        ></div>
        <div className="post-author">
          <p className="display-name">
            {/*isAnonymous ? "Anonymous" : fullname*/}
            {/* {fullname} */}
            Full Name
          </p>
          <p className="username">
            {/* {!isAnonymous && <Link to={`/${username}`}>@{username}</Link>} */}
            @username
          </p>
          <p
            className="date"
            style={{
              position: "absolute",
              top: "1.5rem",
              right: "1rem",
            }}
          >
            {/* {formatDate(date)} */}
            date
          </p>
        </div>
      </div>{" "}
      {/* {content.split("\n").map((line, index) => (
        <p
          key={index}
          style={{
            fontSize: "0.85rem",
            marginTop: "0.1rem",
            marginLeft: "3.5rem",
          }}
        >
          {isCollapsed ? line.slice(0, 120) : line}
        </p>
      ))}
      {content.length > 120 && (
        <p
          className="read-more"
          style={{ marginLeft: "3.5rem" }}
          onClick={toggleReadMore}
        >
          {isCollapsed ? "...read more" : "...show less"}
        </p>
      )} */}
      <p
        style={{
          fontSize: "0.85rem",
          marginTop: "0.1rem",
          marginLeft: "3.5rem",
        }}
      >
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Officia fugit
        eligendi accusantium vel eaque, sunt eum reiciendis odio facilis vitae
        ducimus eos illo sequi natus voluptatum corrupti voluptatibus maxime
        nesciunt! Lorem ipsum dolor sit amet consectetur adipisicing elit.
        Debitis aliquam voluptatibus ratione. Iste, minus! Dolores quia
        exercitationem explicabo aliquam, adipisci soluta numquam eveniet
        aliquid praesentium nisi sint a deleniti aut?
      </p>
      <div
        className="post-interaction"
        style={{
          padding: "1.5rem 2.5rem",
        }}
      >
        <div className="like-container">
          <div
            className={/* isLiked ? "like-icon --isLiked" : */ "like-icon"}
            // onClick={handleLike}
          ></div>
          1000
        </div>
        <div className="comment-container">
          <div
            className="comment-icon"
            // onClick={() => {
            //   setIsPostOpen(!isPostOpen);
            // }}
          ></div>
          10 Replies
        </div>
      </div>
      {/* <Reply /> */}
    </div>
  );
}

export default CommentsReply;
