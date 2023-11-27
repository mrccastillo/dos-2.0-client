import "./EditUserInfo.css";
import EditIcon from "@mui/icons-material/Edit";
import axios from "axios";
import Cookies from "js-cookie";
import { useState } from "react";
import AuthenticationModal from "./AuthenticationModal";
import SuccessModal from "./SuccessModal";
import { URL } from "../../App";

export default function EditUserInfo({
  username,
  fullname,
  firstname,
  lastname,
  bio,
  email,
  onCloseSettings,
}) {
  const token = Cookies.get("token");
  const [firstnameEdit, setFirstnameEdit] = useState(firstname);
  const [lastnameEdit, setLastnameEdit] = useState(lastname);
  const [usernameEdit, setUsernameEdit] = useState(username);
  const [bioEdit, setbioEdit] = useState(bio);
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [isFullnameEditOpen, setIsFullnameEditOpen] = useState(false);
  const [isUsernameEditOpen, setIsUsernameEditOpen] = useState(false);
  const [isBioEditOpen, setIsBioEditOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  async function handleUserUpdate() {
    setErrorMsg("");
    setSuccessMsg("");

    if (updating) return;

    if (!firstnameEdit || !lastnameEdit || !usernameEdit) {
      return setErrorMsg("firstname, lastname, and username cannot be empty");
    }

    const user = {};

    if (firstnameEdit !== firstname) user.firstname = firstnameEdit;
    if (lastnameEdit !== lastname) user.lastname = lastnameEdit;
    if (usernameEdit !== username) user.username = usernameEdit;
    if (bioEdit !== bio) user.bio = bioEdit;

    if (Object.keys(user).length === 0) {
      return setErrorMsg("No changes");
    }

    setUpdating(true);

    try {
      const res = await axios.put(
        `${URL}/user/${Cookies.get("userId")}`,
        user,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      if (res.data.message === "Account Successfully Updated") {
        setIsSuccessModalOpen(true);
        Cookies.set("token", res.data.token, {
          expires: 30 * 24 * 60 * 60,
        }); // 30 day expiration
      }
    } catch (err) {
      if (err.response.data.err.keyValue.username)
        return setErrorMsg("Username is taken.");
      setErrorMsg("An error occurred, Please report it to the administrator");
      return console.error(err);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <>
      <div
        className="edit-userinfo-modal"
        style={{ zIndex: (isChangePasswordOpen || isSuccessModalOpen) && 1 }}
      >
        <div className="userprofile-container --edit-user-details">
          <div
            className="profile-pic --userprofile-pic"
            style={{ width: "7rem", height: "7rem", left: "1rem" }}
          ></div>
          <p className="display-name" style={{ fontSize: "1.3rem" }}>
            {fullname} {"    "}
            <EditIcon
              onClick={() => {
                setIsFullnameEditOpen(!isFullnameEditOpen);
                setIsUsernameEditOpen(false);
                setIsBioEditOpen(false);
              }}
            ></EditIcon>
          </p>
          {isFullnameEditOpen && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingRight: "2rem",
              }}
            >
              <input
                type="text"
                placeholder={"First Name"}
                className="edit-info"
                style={{ width: "48%" }}
                value={firstnameEdit}
                onChange={(e) => {
                  setFirstnameEdit(e.target.value);
                }}
              />
              <input
                type="text"
                placeholder={"Last Name"}
                className="edit-info"
                style={{ width: "48%" }}
                value={lastnameEdit}
                onChange={(e) => {
                  setLastnameEdit(e.target.value);
                }}
              />
            </div>
          )}
          <p className="username" style={{ fontSize: "1rem" }}>
            @{username}{" "}
            <EditIcon
              onClick={() => {
                setIsUsernameEditOpen(!isUsernameEditOpen);
                setIsFullnameEditOpen(false);
                setIsBioEditOpen(false);
              }}
            ></EditIcon>
          </p>
          {isUsernameEditOpen && (
            <input
              type="text"
              // placeholder={username}
              className="edit-info"
              value={usernameEdit}
              onChange={(e) => {
                setUsernameEdit(e.target.value);
              }}
            />
          )}
          {
            <>
              <p className="bio" style={{ fontSize: "0.85rem" }}>
                {bio ? `"${bio}"` : "bio"}
                <EditIcon
                  onClick={() => {
                    setIsBioEditOpen(!isBioEditOpen);
                    setIsFullnameEditOpen(false);
                    setIsUsernameEditOpen(false);
                  }}
                ></EditIcon>
              </p>
              {isBioEditOpen && (
                <input
                  type="text"
                  placeholder={bio}
                  className="edit-info"
                  value={bioEdit}
                  maxLength={100}
                  onChange={(e) => {
                    setbioEdit(e.target.value);
                  }}
                />
              )}
            </>
          }

          <div
            className="delete"
            style={{
              position: "absolute",
              top: "0",
              right: "0",
              // transform: "translate(-50%, 50%)",
            }}
            onClick={onCloseSettings}
          ></div>
        </div>

        <div className="credentials">
          <div className="email-pass-container">
            <div className="username-container">
              <p className="--credential-info">{username}</p>
              <p className="credential-label">Username</p>
            </div>
            <div className="email-container">
              <p className="--credential-info">{email}</p>
              <p className="credential-label">Email</p>
            </div>
            <p
              className="change-pass-btn"
              onClick={() => {
                setIsChangePasswordOpen(!isChangePasswordOpen);
              }}
            >
              Change Password
            </p>
          </div>
        </div>
        <div className="response--container" style={{ height: "1rem" }}>
          {errorMsg.length > 0 && (
            <p className="--server-msg" style={{ height: "1rem" }}>
              {errorMsg}
            </p>
          )}
          {successMsg.length > 0 && (
            <p className="--server-success-msg" style={{ height: "1rem" }}>
              {successMsg}
            </p>
          )}
        </div>

        <button onClick={handleUserUpdate} className="save-user-changes">
          Save Changes
        </button>
      </div>
      {isChangePasswordOpen && (
        <>
          <AuthenticationModal
            onCloseAuthentication={() =>
              setIsChangePasswordOpen(!isChangePasswordOpen)
            }
            email={email}
          />
        </>
      )}
      {isSuccessModalOpen && <SuccessModal isRecover={false} />}
    </>
  );
}
