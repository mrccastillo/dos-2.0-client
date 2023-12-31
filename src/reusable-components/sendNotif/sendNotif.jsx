import { useState } from "react";
// import "./CreatePost.css";
import axios from "axios";
import Cookies from "js-cookie";
import { URL } from "../../App";

function SendNotif({}) {
  //   const [content, setContent] = useState("");
  //   const [category, setCategoy] = useState(0);
  //   const [isPosting, setIsPosting] = useState("Post");
  //   const [isAnonymous, setIsAnonymous] = useState(false);
  //   const [posting, setPosting] = useState(false);

  //   async function handlePostSubmit(e) {
  //     e.preventDefault();
  //     if (posting) return;
  //     if (!content) return;

  //     const trimmedPost = content.trim();
  //     const validatedPost = trimmedPost.replace(/\u2800/g, "");
  //     if (!validatedPost) {
  //       return;
  //     }

  //     setPosting(true);
  //     setIsPosting("Post");

  //     const post = {
  //       userId: userId,
  //       username: username,
  //       fullname: fullname,
  //       content: content,
  //       category: category,
  //       isAnonymous: isAnonymous,
  //       dateCreated: Date.now(),
  //     };

  //     try {
  //       setIsPosting("Posting...");
  //       const token = Cookies.get("token");
  //       const savedPost = await axios.post(`${URL}/post`, post, {
  //         headers: {
  //           Authorization: token,
  //         },
  //       });
  //       onModalClose();
  //       onPostCreated(savedPost.data.savedPost);
  //     } catch (e) {
  //       setIsPosting("Post");
  //       console.error("error:", e);
  //     } finally {
  //       setPosting(false);
  //     }
  //   }

  //   function closeModal() {
  //     onModalClose();
  //   }

  return (
    <>
      <form
        className="create-post-announcement-modal"
        // onSubmit={handlePostSubmit}
      >
        <div>
          <div className="post-announcement-modal-header">
            <h2>Send Feedback</h2>
          </div>
          <div
            style={{
              //   height: "3.5rem",
              paddingBottom: "1rem",
              borderBottom: "1px solid rgba(0, 0, 0, 0.243)",
              textAlign: "center",
              marginBottom: "1rem",
            }}
          >
            <p
              style={{
                fontSize: "0.85rem",
                color: "white",
                marginBottom: "0.5rem",
              }}
            >
              User ID/Username
            </p>
            <input
              type="text"
              style={{
                width: "15rem",
                height: "1.6rem",
                borderRadius: "0.8rem",
                border: "0",
              }}
            />
          </div>
          <div className="post-announcement-modal-content">
            <div className="post-author-info">
              <div className="post-header">
                <div className="profile-pic"></div>
                <div className="post-author">
                  <p
                    className="display-name --white-text"
                    style={{ fontWeight: 500 }}
                  >
                    {/* {fullname} */}
                    DOSAdmin
                  </p>
                  <p className="username --white-text">@username</p>
                </div>
              </div>
            </div>
            <textarea
              className="create-post-announce-content"
              placeholder="Content posted"
              style={{ height: "5rem" }}
              //   value={content}
              //   onChange={(e) => {
              //     setContent(e.target.value);
              //   }}
            ></textarea>
            <div className="post-category">
              {/* <select
                className="select"
                style={{ width: "15rem", padding: "0 1rems" }}
                // onClick={(e) => {
                //   setCategoy(e.target.value);
                // }}
              >
                <option value="0">General</option>
                <option value="1">PUP</option>
                <option value="2">Question</option>
                <option value="3">Rant</option>
                <option value="4">Confession</option>
              </select> */}
              {/* <div className="anonymous-btn">
                <input
                  type="checkbox"
                  id="isAnonymous"
                  //   value={isAnonymous}
                  //   onClick={(e) => {
                  //     setIsAnonymous(e.target.checked);
                  //     // console.log(isAnonymous);
                  //   }}
                />
                <label htmlFor="isAnonymous">Post Anonymously</label>
              </div> */}
            </div>
          </div>
        </div>
        <div className="btn-container">
          <button className="submit-post">{/*isPosting*/}Edit Post</button>
        </div>
        <p className="close-btn">&times;</p>
      </form>
      <div className="overlay"></div>
    </>
  );
}

export default SendNotif;
