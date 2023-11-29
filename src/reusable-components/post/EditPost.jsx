import { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { URL } from "../../App";
import DeletePost from "./DeletePost";

export default function EditPost({
  postId,
  username,
  fullname,
  postcontent,
  isAnonymous,
  onCloseEditPost,
  onUpdatePost,
}) {
  const token = Cookies.get("token");
  const [content, setContent] = useState(postcontent);
  const [isPosting, setIsPosting] = useState("Update");
  const [posting, setPosting] = useState(false);
  const [isDelete, setIsDelete] = useState(false);

  async function handlePostSubmit(e) {
    e.preventDefault();
    if (posting) return;
    if (!content) return;

    const trimmedPost = content.trim();
    const validatedPost = trimmedPost.replace(/\u2800/g, "");
    if (!validatedPost) {
      return;
    }

    setPosting(true);
    setIsPosting("Update");

    const post = {
      content: content,
    };

    try {
      setIsPosting("Updating...");
      await axios.put(`${URL}/post/${postId}`, post, {
        headers: {
          Authorization: token,
        },
      });
      onUpdatePost(content);
      onCloseEditPost();
    } catch (e) {
      setIsPosting("Update");
      console.error("error:", e);
    } finally {
      setPosting(false);
    }
  }

  if (!isDelete)
    return (
      <>
        <form
          className="create-post-announcement-modal"
          onSubmit={handlePostSubmit}
        >
          <div>
            <div className="post-announcement-modal-header">
              <h2>Edit Post</h2>
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
                      {isAnonymous ? "Anonymous" : fullname}
                    </p>
                    <p className="username --white-text">
                      {!isAnonymous && ` @${username}`}
                    </p>
                  </div>
                </div>
              </div>
              <textarea
                className="create-post-announce-content"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                }}
              ></textarea>
            </div>
          </div>
          <div className="btn-container">
            <button className="submit-post" style={{ marginBottom: "1rem" }}>
              {isPosting}
            </button>
            <button className="submit-post" onClick={() => setIsDelete(true)}>
              Delete
            </button>
          </div>
          <p className="close-btn" onClick={onCloseEditPost}>
            &times;
          </p>
        </form>
        <div className="overlay"></div>
      </>
    );
  else
    return <DeletePost postId={postId} onCloseDeleteModal={onCloseEditPost} />;
}
