import "./SuccessModal.css";

export default function SuccessModal() {
  return (
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
        <h2>Account Successfully Updated!</h2>
        <p style={{ fontSize: "0.9rem", marginTop: "2rem" }}>
          Account Successfully Updated. To view the changes refresh the page
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
  );
}
