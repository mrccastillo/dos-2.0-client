import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import Post from "../../../reusable-components/post/Post";
import Announce from "../../../reusable-components/announcement/Announce";
import Nav from "../../nav/components/Nav";
import CreateAnnouncement from "../../../reusable-components/announcement/CreateAnnouncement";
import CreatePost from "../../../reusable-components/post/CreatePost";
import "../stylesheets/Userprofile.css";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function Userprofile({ userLoggedIn }) {
  const token = localStorage.getItem("token");
  const { username } = useParams();
  const [user, setUser] = useState([]);
  const [posts, setPosts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateAnnounceOpen, setIsCreateAnnounceOpen] = useState(false);

  const filteredPosts = posts.filter((el) => el.username === user.username);
  const filteredAnnouncements = announcements.filter(
    (el) => el.username === user.username
  );

  const fetchUser = async () => {
    try {
      const userValid = await axios.get(
        `https://backend.dosshs.online/api/user/find?account=${username}`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
    } catch (err) {
      if (err.response.data.message == "User not found") {
        return (location.href = "/");
      } else {
        return console.error(err);
      }
    }

    try {
      const userResponse = await axios.get(
        `https://backend.dosshs.online/api/user?username=${username}`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      setUser(userResponse.data.other);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const fetchPosts = async () => {
    try {
      const announcementResponse = await axios.get(
        "https://backend.dosshs.online/api/announcement",
        {
          headers: {
            Authorization: token,
          },
        }
      );

      setAnnouncements(announcementResponse.data.reverse());

      const postResponse = await axios.get(
        "https://backend.dosshs.online/api/post",
        {
          headers: {
            Authorization: token,
          },
        }
      );
      setPosts(postResponse.data.reverse());
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const handlePostCreated = () => {
    fetchPosts();
  };

  useEffect(() => {
    let isMounted = true;
    // console.log(userLoggedIn);
    const fetchData = async () => {
      await fetchUser();
      if (isMounted) {
        fetchPosts();
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [username]);

  return (
    <>
      {user ? (
        <Helmet>
          <title>{`DOS - ${user.username}`}</title>
          <meta property="og:title" content={`${user.fullname}`} />
        </Helmet>
      ) : null}

      <div className="container">
        <Nav user={userLoggedIn.username} />
        <div className="dashboard --userprofile">
          <h2 className="--big-h2">Profile</h2>
          <div className="userprofile-container">
            <div className="profile-pic --userprofile-pic"></div>
            <p className="display-name" style={{ fontSize: "1.3rem" }}>
              {user.fullname}
            </p>
            <p className="username" style={{ fontSize: "1rem" }}>
              {" "}
              @{user.username}
            </p>
            {user.bio ? <p className="bio">"{user.bio}"</p> : null}
          </div>
          <div className="userpost-container">
            <div className="userpost-container-header">
              {user._id === userLoggedIn._id ? (
                <h2 style={{ fontSize: "1.5rem" }}>
                  Your Post & Announcements
                </h2>
              ) : (
                <h2 style={{ fontSize: "1.5rem" }}>
                  {user.username} Posts & Announcements
                </h2>
              )}
              {user._id === userLoggedIn._id ? (
                <div className="userprofile-createpost-announce-container">
                  <button
                    className="post-btn"
                    style={{ marginRight: "1rem" }}
                    onClick={() => {
                      setIsCreateAnnounceOpen(!isCreateAnnounceOpen);
                    }}
                  >
                    <i className="material-icons">add_circle_outline</i>Make an
                    Announcement
                  </button>
                  <button
                    className="post-btn"
                    onClick={() => {
                      setIsCreatePostOpen(!isCreatePostOpen);
                    }}
                  >
                    <i className="material-icons">add_circle_outline</i> Post
                    Something
                  </button>
                </div>
              ) : null}
            </div>
            <div className="user-post-and-announcements">
              <div className="user-announcement">
                {filteredAnnouncements.length > 0 ? (
                  filteredAnnouncements.map((filteredAnnounce) => (
                    <Announce
                      key={filteredAnnounce._id}
                      fullname={filteredAnnounce.fullname}
                      username={filteredAnnounce.username}
                      content={filteredAnnounce.content}
                    />
                  ))
                ) : (
                  <p className="empty">
                    {userLoggedIn.username === username
                      ? "You haven't announced anything yet"
                      : `${username} haven't announced anything yet`}
                  </p>
                )}
              </div>
              <div className="user-post">
                {filteredPosts.length > 0 ? (
                  filteredPosts
                    .filter((filteredPost) => !filteredPost.isAnonymous)
                    .map((filteredPost) => (
                      <Post
                        key={filteredPost._id}
                        fullname={filteredPost.fullname}
                        username={filteredPost.username}
                        content={filteredPost.content}
                        date={filteredPost.dateCreated}
                        category={filteredPost.category}
                        isAnonymous={filteredPost.isAnonymous}
                      />
                    ))
                ) : (
                  <p className="empty">
                    {userLoggedIn.username === username
                      ? "You haven't posted anything yet"
                      : `${username} haven't posted anything yet`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {isCreatePostOpen && (
        <CreatePost
          fullname={user.fullname}
          username={user.username}
          userId={user._id}
          onPostCreated={handlePostCreated}
          onModalClose={() => {
            setIsCreatePostOpen(!isCreatePostOpen);
          }}
        />
      )}
      {isCreateAnnounceOpen && (
        <CreateAnnouncement
          fullname={user.fullname}
          username={user.username}
          userId={user.userId}
          onAnnouncementCreated={handlePostCreated}
          onModalClose={() => {
            setIsCreateAnnounceOpen(!isCreateAnnounceOpen);
          }}
        />
      )}
    </>
  );
}
