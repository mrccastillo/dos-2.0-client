import PostSkeleton from "../../../reusable-components/skeletonloading/PostSkeleton";
import Post from "../../../reusable-components/post/Post";
import CreatePost from "../../../reusable-components/post/CreatePost";
import "../stylesheets/Home.css";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { useInView } from "react-intersection-observer";

export default function Home({ fullname, username, userId }) {
  const { ref: myRef, inView: fetchPost } = useInView();
  const token = Cookies.get("token");
  const userUserId = Cookies.get("userId");
  const [posts, setPosts] = useState([]);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [postFilter, setPostFilter] = useState();
  const [loading, setLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const [fetchAgain, setFetchAgain] = useState(false);

  const fetchPosts = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const lastPostId = posts.length > 0 ? posts[posts.length - 1]._id : null;

      const post = await axios.get(
        `https://backend.dosshs.online/api/post?postId=${lastPostId}`,
        {
          headers: {
            Authorization: token,
          },
        }
      );

      const newPosts = post.data;

      const postsWithCounts = await Promise.all(
        newPosts.map(async (post) => {
          try {
            const likeCountResponse = await axios.get(
              `https://backend.dosshs.online/api/post/like/count/${post._id}`,
              {
                headers: {
                  Authorization: token,
                },
              }
            );

            const commentCountResponse = await axios.get(
              `https://backend.dosshs.online/api/post/comment/count?postId=${post._id}`,
              {
                headers: {
                  Authorization: token,
                },
              }
            );

            const likeCount = likeCountResponse.data.likeCount;
            const commentCount = commentCountResponse.data.commentCount;

            const liked = likeCountResponse.data.likes.some(
              (like) => like.userId === userUserId
            );

            const likedId = likeCountResponse.data.likes
              .filter((like) => like.userId === userUserId)
              .map((like) => like._id);

            return {
              ...post,
              likeCount: likeCount,
              commentCount: commentCount,
              liked: liked,
              likeId: likedId,
            };
          } catch (error) {
            console.error(
              "Error fetching like/comment counts for a post:",
              error
            );
            // Return a default object if there's an error
            return {
              ...post,
              likeCount: 0,
              commentCount: 0,
              liked: false,
              likeId: [],
            };
          }
        })
      );

      // Filter out duplicates based on _id
      const uniquePosts = postsWithCounts.filter(
        (post, index, self) =>
          index === self.findIndex((p) => p._id === post._id)
      );

      setPosts((prevPosts) => [...prevPosts, ...uniquePosts]);
      setLoading(false);

      if (fetchAgain) setFetchAgain(false);
      if (uniquePosts.length === 0) setShowLoading(false);
      else CheckToFetchMore();
    } catch (error) {
      console.error("Error fetching posts:", error);
      setLoading(false);
    }
  };

  const CheckToFetchMore = () => {
    if (fetchPost)
      setTimeout(() => {
        if (!fetchAgain) setFetchAgain(true);
      }, 3000);
  };

  useEffect(() => {
    if (fetchPost && !loading) fetchPosts();
  }, [fetchPost, fetchAgain]);

  const handlePostCreated = (post) => {
    post = {
      ...post,
      likeCount: 0,
      commentCount: 0,
    };
    setPosts((prevPosts) => [post, ...prevPosts]);
  };

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
          <span
            className={postFilter === 4 ? "--chip active-chip" : "--chip"}
            onClick={() => {
              setPostFilter(4);
              // console.log(postFilter);
            }}
          >
            Confession
          </span>
          <span
            className={postFilter === 5 ? "--chip active-chip" : "--chip"}
            onClick={() => {
              setPostFilter(5);
              // console.log(postFilter);
            }}
          >
            Anonymous
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
            {postFilter === 5
              ? posts
                  .filter((el) => el.isAnonymous === true)
                  .map((el) => (
                    <Post
                      key={el._id}
                      postId={el._id}
                      userUsername={username}
                      userUserId={userId}
                      userFullName={fullname}
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
                    />
                  ))
              : postFilter === undefined
              ? posts.map((el) => (
                  <Post
                    key={el._id}
                    postId={el._id}
                    userUsername={username}
                    userUserId={userId}
                    userFullName={fullname}
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
                  />
                ))
              : posts
                  .filter((el) => el.category === postFilter)
                  .map((el) => (
                    <Post
                      key={el._id}
                      postId={el._id}
                      userUsername={username}
                      userUserId={userId}
                      userFullName={fullname}
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
                    />
                  ))}

            {posts.length === 0 && <PostSkeleton cards={1} />}
            {showLoading ? (
              <div ref={myRef}>
                <PostSkeleton cards={1} />
              </div>
            ) : null}
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
