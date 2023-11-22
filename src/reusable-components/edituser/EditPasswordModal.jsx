import { useState } from "react";

export default function handleChangePass({ onCloseModal }) {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  function handleChangePass() {
    console.log("password changed");
  }

  return (
    <div className="change-pass-modal">
      <div className="change-pass-input-fields">
        <input
          type="password"
          name=""
          className="change-pass-input --current-pass"
        />
        <p className="change-pass-label">Current Password</p>
        <input type="password" name="" className="change-pass-input" />
        <p className="change-pass-label">New Password</p>
        <input type="password" name="" className="change-pass-input" />
        <p className="change-pass-label">Confirm Password</p>
      </div>
      <div
        className="delete"
        onClick={onCloseModal}
        style={{
          position: "absolute",
          top: "1.3rem",
          right: "1.3rem",
        }}
      ></div>
      <button
        onClick={handleChangePass}
        className="save-user-changes --confirm-pass "
      >
        Confirm
      </button>
    </div>
  );
}
