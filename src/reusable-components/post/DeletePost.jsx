import { useState } from "react";

import "./DeletePost.css";

function DeletePost({ onCloseDeleteModal }) {
  function handleDeletePost() {}

  return (
    <div className="delete-post-modal">
      <div className="delete-post-text">
        <h3>Are you sure you want to delete this post?</h3>
        <p style={{ marginTop: "1.2rem", fontSize: "0.9rem" }}>
          By clicking yes, you wont be able retrieve this post/announcement
        </p>
      </div>
      <div className="delete-post-buttons">
        <button className="delete-post-modal-btn " onClick={onCloseDeleteModal}>
          NO
        </button>
        <button
          className="delete-post-modal-btn --yes"
          onClick={handleDeletePost}
        >
          YES
        </button>
      </div>
    </div>
  );
}

export default DeletePost;
