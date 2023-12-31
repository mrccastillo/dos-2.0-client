import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "./PostSkeleton.css";

export default function CommentSkeleton({ cards }) {
  return Array(cards)
    .fill(0)
    .map((item) => (
      <SkeletonTheme baseColor="#0cbfdf45" highlightColor="#c8fdff4e">
        <div className="post-skeleton --announcememt-skel --comment-skel">
          <div
            className="post-author-skeleton"
            style={{ alignItems: "flex-start" }}
          >
            <div className="left-col">
              <div
                className="skeleton --comment-skeleton"
                style={{
                  height: "2.5rem",
                  width: "2.5rem",
                  borderRadius: "50%",
                }}
              ></div>
            </div>
            <div className="right-col">
              <div
                className="skeleton --comment-skeleton"
                style={{ height: "0.7rem", width: "100%" }}
              ></div>
              <div
                className="skeleton --comment-skeleton"
                style={{ height: "0.7rem", width: "100%" }}
              ></div>
              <div
                className="skeleton --comment-skeleton"
                style={{ height: "1.8rem", width: "100%" }}
              ></div>
            </div>
          </div>

          <div className="post-interaction-skeleton">
            <div
              className="skeleton --comment-skeleton"
              style={{ height: "1.5rem", width: "100%" }}
            ></div>
          </div>
        </div>
      </SkeletonTheme>
    ));
}
