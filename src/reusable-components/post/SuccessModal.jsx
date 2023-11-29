import "./SuccessModal.css";

export default function SuccessModal() {
  return (
    <>
      <div className="success-change-modal">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div className="success-image"></div>
          <h2>POST SUCCESSFULLY DELETED</h2>
          <p style={{ fontSize: "0.9rem", marginTop: "2rem" }}>
            To view the changes refresh the page
          </p>
        </div>
        <button
          className="save-user-changes"
          onClick={() => {
            location.reload();
          }}
        >
          REFRESH
        </button>
      </div>
      <div className="overlay"></div>
    </>
  );
}
