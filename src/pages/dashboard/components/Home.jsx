import Post from "../../../reusable-components/post/Post";
import CreatePost from "../../../reusable-components/post/CreatePost";
import "../stylesheets/Home.css";
import axios from "axios";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

export default function Home({ fullname, username, userId }) {
  const token = Cookies.get("token");
  const userUsername = Cookies.get("username");
  const [posts, setPosts] = useState([]);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [postFilter, setPostFilter] = useState();

  const fetchPosts = async () => {
    try {
      const post = await axios.get("https://backend.dosshs.online/api/post", {
        headers: {
          Authorization: token,
        },
      });

      const getLikesPromises = post.data.map(async (post) => {
        const likeCountResponse = await axios.get(
          `https://backend.dosshs.online/api/post/like/count/${post._id}`,
          {
            headers: {
              Authorization: token,
            },
          }
        );

        const liked = likeCountResponse.data.likes.some(
          (like) => like.username === userUsername
        );

        const likedId = likeCountResponse.data.likes
          .filter((like) => like.username === userUsername)
          .map((like) => like._id);

        const [likeCount] = await Promise.all([likeCountResponse]);

        const commentCountResponse = await axios.get(
          `https://backend.dosshs.online/api/post/comment/count/${post._id}`,
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

      const postsWithCounts = await Promise.all(getLikesPromises);
      setPosts(postsWithCounts.reverse());
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const handlePostCreated = () => {
    fetchPosts();
  };

  useEffect(() => {
    fetchPosts();
    // console.log(posts);
  }, []);

  return (
    <>
      <div className="home-container">
        <div className="filter-container">
          <span
            className={
              postFilter === undefined ? "--chip active-chip" : "--chip"
            }
            onClick={() => {
              setPostFilter();
              // console.log(postFilter);
            }}
          >
            DOS is For You!
          </span>
          <span
            className={postFilter === 0 ? "--chip active-chip" : "--chip"}
            onClick={() => {
              setPostFilter(0);
              // console.log(postFilter);
            }}
          >
            General
          </span>
          <span
            className={postFilter === 1 ? "--chip active-chip" : "--chip"}
            onClick={() => {
              setPostFilter(1);
              // console.log(postFilter);
            }}
          >
            PUP
          </span>
          <span
            className={postFilter === 2 ? "--chip active-chip" : "--chip"}
            onClick={() => {
              setPostFilter(2);
              // console.log(postFilter);
            }}
          >
            Question
          </span>
          <span
            className={postFilter === 3 ? "--chip active-chip" : "--chip"}
            onClick={() => {
              setPostFilter(3);
              // console.log(postFilter);
            }}
          >
            Rant
          </span>
        </div>
        <div className="post-container">
          <div className="create-post">
            <button
              className="post-btn"
              onClick={() => setIsCreatePostOpen(!isCreatePostOpen)}
            >
              <i className="material-icons">add_circle_outline</i> Post
              Something
            </button>
          </div>
          <div className="posts-list">
            {/* {posts
              .filter(
                (el) => postFilter === undefined || el.category === postFilter
              )
              .map((el) => {
                <Post
                  key={el._id}
                  fullname={el.fullname}
                  username={el.username}
                  content={el.content}
                  date={el.dateCreated}
                  category={el.category}
                  isAnonymous={el.isAnonymous}
                />;
              })} */}
            <div className="posts-list">
              {postFilter === undefined
                ? posts.map((el) => (
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
                      userUsername={username}
                      userUserId={userId}
                    />
                  ))
                : posts
                    .filter((el) => el.category === postFilter)
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
                        userUsername={username}
                        userUserId={userId}
                      />
                    ))}
              {posts.length === 0 ? "Loading..." : null}
            </div>
          </div>
        </div>
      </div>
      {isCreatePostOpen && (
        <CreatePost
          fullname={fullname}
          username={username}
          userId={userId}
          onPostCreated={handlePostCreated}
          onModalClose={() => {
            setIsCreatePostOpen(!isCreatePostOpen);
          }}
        />
      )}
    </>
  );
}
