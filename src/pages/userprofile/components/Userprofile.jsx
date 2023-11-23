import { useState, useEffect } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import Error404 from "../../pagenotfound/components/Error404";
import Post from "../../../reusable-components/post/Post";
import Announce from "../../../reusable-components/announcement/Announce";
import Nav from "../../nav/components/Nav";
import CreateAnnouncement from "../../../reusable-components/announcement/CreateAnnouncement";
import CreatePost from "../../../reusable-components/post/CreatePost";
import EditUserInfo from "../../../reusable-components/edituser/EditUserInfo";
import PostSkeleton from "../../../reusable-components/skeletonloading/PostSkeleton";
import AnnouncementSkeleton from "../../../reusable-components/skeletonloading/AnnouncementSkeleton";
import "../stylesheets/Userprofile.css";
import { useParams } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";

export default function Userprofile({ userLoggedIn }) {
  const token = Cookies.get("token");
  const userId = Cookies.get("userId");
  const { username } = useParams();
  const [user, setUser] = useState([]);
  const [userFound, setUserFound] = useState(true);
  const [posts, setPosts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateAnnounceOpen, setIsCreateAnnounceOpen] = useState(false);
  const [postFetched, setPostFetched] = useState(false);
  const [announcementFetched, setAnnouncementFetched] = useState(false);

  const filteredPosts = posts.filter((el) => el.username === user.username);
  const filteredAnnouncements = announcements.filter(
    (el) => el.username === user.username
  );

  const fetchUser = async () => {
    try {
      await axios.get(
        `https://backend.dosshs.online/api/user/find?account=${username}`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
    } catch (err) {
      setUserFound(false);
      return console.error(err);
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
      setUserFound(false);
      console.error("Error fetching user:", error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const announcement = await axios.get(
        "https://backend.dosshs.online/api/announcement",
        {
          headers: {
            Authorization: token,
          },
        }
      );

      const getAnnouncementLikesPromises = announcement.data.map(
        async (announcement) => {
          const likeCountResponse = await axios.get(
            `https://backend.dosshs.online/api/announcement/like/count/${announcement._id}`,
            {
              headers: {
                Authorization: token,
              },
            }
          );

          const liked = likeCountResponse.data.likes.some(
            (like) => like.userId === userId
          );

          const likedId = likeCountResponse.data.likes
            .filter((like) => like.userId === userId)
            .map((like) => like._id);

          const [likeCount] = await Promise.all([likeCountResponse]);

          const commentCountResponse = await axios.get(
            `https://backend.dosshs.online/api/announcement/comment/count?announcementId=${announcement._id}`,
            {
              headers: {
                Authorization: token,
              },
            }
          );

          const [commentCount] = await Promise.all([commentCountResponse]);

          return {
            ...announcement,
            likeCount: likeCountResponse.data.likeCount,
            liked: liked,
            likeId: likedId,
            commentCount: commentCount.data.commentCount,
          };
        }
      );

      const announcementsWithCounts = await Promise.all(
        getAnnouncementLikesPromises
      );
      setAnnouncements(announcementsWithCounts.reverse());
      setAnnouncementFetched(true);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const fetchPosts = async () => {
    try {
      const post = await axios.get("https://backend.dosshs.online/api/post", {
        headers: {
          Authorization: token,
        },
      });

      const getPostLikesPromises = post.data.map(async (post) => {
        const likeCountResponse = await axios.get(
          `https://backend.dosshs.online/api/post/like/count/${post._id}`,
          {
            headers: {
              Authorization: token,
            },
          }
        );

        const liked = likeCountResponse.data.likes.some(
          (like) => like.userId === userId
        );

        const likedId = likeCountResponse.data.likes
          .filter((like) => like.userId === userId)
          .map((like) => like._id);

        const [likeCount] = await Promise.all([likeCountResponse]);

        const commentCountResponse = await axios.get(
          `https://backend.dosshs.online/api/post/comment/count?postId=${post._id}`,
          {
            headers: {
              Authorization: token,
            },
          }
        );

        const [commentCount] = await Promise.all([commentCountResponse]);

        return {
          ...post,
          likeCount: likeCount.data.likeCount,
          liked: liked,
          likeId: likedId,
          commentCount: commentCount.data.commentCount,
        };
      });

      //

      // });

      const postsWithCounts = await Promise.all(getPostLikesPromises);
      setPosts(postsWithCounts.reverse());
      setPostFetched(true);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const handlePostCreated = () => {
    fetchPosts();
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        await fetchUser();
        if (isMounted) {
          fetchPosts();
          fetchAnnouncements();
        }
      } catch (error) {
        if (isMounted) {
          setUserFound(false); // Set userFound to false on error
        }
        console.error("Error fetching data:", error);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [username]);

  if (userFound)
    return (
      <HelmetProvider>
        <Helmet>
          <title>{user.username}</title>
          <meta property="og:title" content={user.fullname} />
        </Helmet>

        <div className="container">
          <Nav
            user={userLoggedIn.username}
            email={userLoggedIn.email}
            bio={userLoggedIn.bio}
            fullname={userLoggedIn.fullname}
          />
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
              {user.bio ? (
                <div className="bio">
                  {user.bio.split("\n").map((line, index) => (
                    <p key={index} style={{ fontSize: "0.95rem" }}>
                      "{line}"
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="userpost-container">
              <div className="userpost-container-header">
                {user._id === userLoggedIn._id ? (
                  <h2 style={{ fontSize: "1.5rem" }}>
                    Your Announcements & Posts
                  </h2>
                ) : (
                  <h2 style={{ fontSize: "1.5rem" }}>
                    {user.username} Announcements & Posts
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
                      <i className="material-icons">add_circle_outline</i>Make
                      an Announcement
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
                  {!announcementFetched ? (
                    <AnnouncementSkeleton cards={2} />
                  ) : filteredAnnouncements.length > 0 ? (
                    filteredAnnouncements.map((el) => (
                      <Announce
                        key={el._id}
                        announceId={el._id}
                        fullname={el.fullname}
                        username={el.username}
                        content={el.content}
                        date={el.dateCreated}
                        liked={el.liked}
                        likeCount={el.likeCount}
                        likeId={el.likeId}
                        commentCount={el.commentCount}
                        userUsername={userLoggedIn.username}
                        userUserId={userLoggedIn._id}
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
                  {!postFetched ? (
                    <PostSkeleton cards={2} />
                  ) : filteredPosts.length > 0 ? (
                    filteredPosts
                      .filter((filteredPost) => !filteredPost.isAnonymous)
                      .map((el) => (
                        <Post
                          key={el._id}
                          postId={el._id}
                          fullname={el.fullname}
                          username={el.username}
                          content={el.content}
                          date={el.dateCreated}
                          category={el.category}
                          isAnonymous={el.isAnonymous}
                          likeCount={el.likeCount}
                          liked={el.liked}
                          likeId={el.likeId}
                          commentCount={el.commentCount}
                          userUsername={userLoggedIn.username}
                          userUserId={userLoggedIn._id}
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
            userId={user._id}
            onAnnouncementCreated={handlePostCreated}
            onModalClose={() => {
              setIsCreateAnnounceOpen(!isCreateAnnounceOpen);
            }}
          />
        )}
      </HelmetProvider>
    );
  else return <Error404 />;
}
