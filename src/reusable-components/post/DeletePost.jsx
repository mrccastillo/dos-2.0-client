import { useState } from "react";
import SuccessModal from "./SuccessModal";
import axios from "axios";
import "./DeletePost.css";
import Cookies from "js-cookie";
import { URL } from "../../App";

function DeletePost({ postId, onCloseDeleteModal }) {
  const token = Cookies.get("token");
  const [isDeleting, setIsDeleting] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleted, setIsDeleted] = useState(false);

  async function handlePostDelete(e) {
    e.preventDefault();
    if (deleting) return;

    setDeleting(true);

    try {
      setIsDeleting("Deleting...");
      await axios.delete(`${URL}/post/${postId}`, {
        headers: {
          Authorization: token,
        },
      });
      setIsDeleted(true);
    } catch (e) {
      setIsDeleting("Error in Deleting the Post, Please try again later");
      console.error("error:", e);
    } finally {
      setDeleting(false);
    }
  }

  if (!deleted)
    return (
      <>
        <div className="delete-post-modal">
          <div className="delete-post-text">
            <h3>Are you sure you want to delete this post?</h3>
            <p style={{ marginTop: "1.2rem", fontSize: "0.9rem" }}>
              By clicking yes, you wont be able to retrieve this post
            </p>
            <p className=".--server-msg"></p>
            <p className=".--server-success-msg"></p>
          </div>
          <div className="delete-post-buttons">
            <button
              className="delete-post-modal-btn "
              onClick={onCloseDeleteModal}
            >
              NO
            </button>
            <button
              className="delete-post-modal-btn --yes"
              onClick={handlePostDelete}
            >
              YES
            </button>
          </div>
        </div>
        <div className="overlay"></div>
      </>
    );
  else return <SuccessModal />;
}

export default DeletePost;
