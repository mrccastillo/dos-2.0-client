import "./AuthenticationModal.css";

export default function AuthenticationModal({ onCloseAuthentication }) {
  return (
    <div className="authentication-modal">
      <h2 className="authentication-header">Authentication</h2>
      <div className="code-container">
        <p className="code-text">
          Sent a code to example@email.com to confirm it's you before changing
          your password.
        </p>
        <input
          type="text"
          className="code-field"
          placeholder="Enter your code here"
        />
        <p style={{ fontSize: "0.85rem", color: "red", height: "1rem" }}>
          Incorrect code
        </p>
        <br />
        <button
          className="submit-authentication"
          onClick={() => {
            alert("ANTOK NA AKO! PASSWORD SUCCESSFULLY UPDATED!");
          }}
        >
          SUMBIT
        </button>
      </div>
      <div
        className="delete"
        style={{ position: "absolute", top: "1.3rem", right: "1.3rem" }}
        onClick={onCloseAuthentication}
      ></div>
    </div>
  );
}
