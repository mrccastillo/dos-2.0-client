import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "./PostSkeleton.css";

export default function CommentSkeleton({ cards }) {
  return Array(cards)
    .fill(0)
    .map((item) => (
      <SkeletonTheme baseColor="#0cbfdf45" highlightColor="#c8fdff4e">
        <div className="post-skeleton --announcememt-skel">
          <div
            className="post-author-skeleton"
            style={{ alignItems: "flex-start" }}
          >
            <div className="left-col">
              <Skeleton circle width={45} height={45} />
            </div>
            <div className="right-col">
              <Skeleton count={2} height={"0.7rem"} />
              <Skeleton height={"2rem"} />
            </div>
          </div>
          {/* <div
            className="post-content-skeleton"
            style={{ border: 0, padding: "0.2rem 0" }}
          >
            <Skeleton height={"2rem"} />
          </div> */}
          <div className="post-interaction-skeleton">
            <Skeleton />
          </div>
        </div>
      </SkeletonTheme>
    ));
}
