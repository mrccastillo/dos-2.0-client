import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "./PostSkeleton.css";

export default function PostSkeleton({ cards }) {
  return Array(cards)
    .fill(0)
    .map((item) => (
      // <SkeletonTheme baseColor="#0cbfdf45" highlightColor="#c8fdff4e">
      <div className="post-skeleton">
        <div className="post-author-skeleton">
          <div className="left-col">
            <div
              className="skeleton"
              style={{ height: "2.5rem", width: "2.5rem", borderRadius: "50%" }}
            ></div>
            {/* <Skeleton circle width={45} height={45} style={{}} /> */}
          </div>
          <div className="right-col">
            <div
              className="skeleton"
              style={{ height: "0.7rem", width: "100%" }}
            ></div>
            <div
              className="skeleton"
              style={{ height: "0.7rem", width: "100%" }}
            ></div>
            <div
              className="skeleton"
              style={{ height: "0.7rem", width: "100%" }}
            ></div>
            {/* <Skeleton height={"0.7rem"} count={3} /> */}
          </div>
        </div>
        <div className="post-content-skeleton">
          <div
            className="skeleton"
            style={{ height: "0.7rem", width: "100%" }}
          ></div>
          <div
            className="skeleton"
            style={{ height: "0.7rem", width: "100%" }}
          ></div>
          {/* <Skeleton count={2} /> */}
        </div>
        <div className="post-interaction-skeleton">
          <div
            className="skeleton"
            style={{ height: "1.5rem", width: "100%" }}
          ></div>
          {/* <Skeleton height={"1.5rem"} /> */}
        </div>
      </div>
      // {/* </SkeletonTheme> */}
    ));
}
