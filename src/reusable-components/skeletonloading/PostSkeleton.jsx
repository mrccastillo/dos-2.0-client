import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "./PostSkeleton.css";

export default function PostSkeleton({ cards }) {
  return Array(cards)
    .fill(0)
    .map((item) => (
      <SkeletonTheme baseColor="#0cbfdf45" highlightColor="#c8fdff4e">
        <div className="post-skeleton">
          <div className="post-author-skeleton">
            <div className="left-col">
              <Skeleton circle width={45} height={45} style={{}} />
            </div>
            <div className="right-col">
              <Skeleton height={"0.7rem"} count={3} />
            </div>
          </div>
          <div className="post-content-skeleton">
            <Skeleton count={2} />
          </div>
          <div className="post-interaction-skeleton">
            <Skeleton height={"1.5rem"} />
          </div>
        </div>
      </SkeletonTheme>
    ));
}
