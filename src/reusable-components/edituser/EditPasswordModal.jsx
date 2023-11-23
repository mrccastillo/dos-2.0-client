import axios from "axios";
import Cookies from "js-cookie";
import { useState } from "react";
import AuthenticationModal from "./AuthenticationModal";

export default function handleChangePass({ onCloseModal }) {
  const token = Cookies.get("token");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isAuthenticationOpen, setIsAuthenticationOpen] = useState(false);

  async function handleChangePass() {
    setErrorMsg("");
    setSuccessMsg("");
    if (!currentPass || !newPass || !confirmPass) {
      return setErrorMsg("Please fill out the fields.");
    }
    if (newPass !== confirmPass) {
      return setErrorMsg("Passwords do not match");
    }

    if (updating) {
      return setErrorMsg("Already Updating Please Wait");
    }
    setUpdating(true);

    const user = {
      password: currentPass,
      newPassword: newPass,
    };

    try {
      const res = await axios.put(
        `https://backend.dosshs.online/api/user/${Cookies.get("userId")}`,
        user,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      if (res.data.message === "Account Successfully Updated") {
        Cookies.set("token", res.data.token, {
          expires: 30 * 24 * 60 * 60,
        }); // 30 day expiration
        setSuccessMsg("Password Successfully Updated");
      }
    } catch (err) {
      if (err.response.data.message === "Incorrect Password") {
        setErrorMsg("Current password is incorrect");
        return console.error(err);
      } else {
        setErrorMsg("Error occured while updating your password");
        return console.error(err);
      }
    } finally {
      setUpdating(false);
    }
  }

  return (
    <>
      {isAuthenticationOpen ? (
        <AuthenticationModal
          onCloseAuthentication={() => {
            setIsAuthenticationOpen(!isAuthenticationOpen);
          }}
        />
      ) : (
        <div className="change-pass-modal">
          <div className="change-pass-input-fields">
            <input
              type="password"
              name=""
              className="change-pass-input --current-pass"
              value={currentPass}
              onChange={(e) => {
                setCurrentPass(e.target.value);
              }}
            />
            <p className="change-pass-label">Current Password</p>
            <input
              type="password"
              name=""
              className="change-pass-input"
              value={newPass}
              onChange={(e) => {
                setNewPass(e.target.value);
              }}
            />
            <p className="change-pass-label">New Password</p>
            <input
              type="password"
              name=""
              className="change-pass-input"
              value={confirmPass}
              onChange={(e) => {
                setConfirmPass(e.target.value);
              }}
            />
            <p className="change-pass-label">Confirm Password</p>
          </div>
          <p className="--server-msg">{errorMsg}</p>
          <p className="--server-success-msg">{successMsg}</p>
          <button
            onClick={() => {
              setIsAuthenticationOpen(!isAuthenticationOpen);
              handleChangePass();
            }}
            className="save-user-changes --confirm-pass "
          >
            Confirm
          </button>
          <div
            className="delete"
            onClick={onCloseModal}
            style={{
              position: "absolute",
              top: "1.3rem",
              right: "1.3rem",
            }}
          ></div>
        </div>
      )}
    </>
  );
}
