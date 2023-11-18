import "../stylesheets/Error404.css";

export default function Error404() {
  return (
    <div className="error-page-background">
      <div className="error-msg-container">
        <h2 className="error">
          OOPS!
          <br />
          (⁠๑⁠´⁠•⁠.̫⁠ ⁠•⁠ ⁠`⁠๑⁠)
        </h2>
        <p className="error-content">
          We’re very sorry for the inconvenience. Looks like your trying to
          <br />
          access a page that has been deleted or have never existed
        </p>
        <button
          className="--chip active-chip homepage-btn"
          onClick={() => {
            location.href = "/";
          }}
        >
          GO BACK TO HOME PAGE
        </button>
      </div>
    </div>
  );
}
