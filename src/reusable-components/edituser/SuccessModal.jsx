import "./SuccessModal.css";

export default function SuccessModal({ isRecover }) {
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
        <h2>
          {isRecover
            ? "Account Successfully Recovered!"
            : "Account Successfully Updated!"}
        </h2>
        <p style={{ fontSize: "0.9rem", marginTop: "2rem" }}>
          {isRecover
            ? "Glad to have you back : )"
            : "To view the changes refresh the page"}
        </p>
      </div>
      <button
        className="save-user-changes"
        onClick={() => {
          location.reload();
        }}
      >
        {isRecover ? "CONTINUE" : "REFRESH"}
      </button>
    </div>
  );
}
