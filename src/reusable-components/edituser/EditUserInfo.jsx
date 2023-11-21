import "./EditUserInfo.css";
import EditIcon from "@mui/icons-material/Edit";
import { useState } from "react";

export default function EditUserInfo({
  username,
  fullname,
  bio,
  email,
  onCloseSettings,
}) {
  const [fullnameEdit, setFullnameEdit] = useState(fullname);
  const [usernameEdit, setUsernameEdit] = useState(username);
  const [bioEdit, setbioEdit] = useState(bio);

  const [isFullnameEditOpen, setIsFullnameEditOpen] = useState(false);
  const [isUsernameEditOpen, setIsUsernameEditOpen] = useState(false);
  const [isBioEditOpen, setIsBioEditOpen] = useState(false);

  return (
    <div className="edit-userinfo-modal">
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
          <input type="text" placeholder={fullname} className="edit-info" />
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
          <input type="text" placeholder={username} className="edit-info" />
        )}
        {bio ? (
          <>
            <p className="bio">
              "{bio}"{" "}
              <EditIcon
                onClick={() => {
                  setIsBioEditOpen(!isBioEditOpen);
                  setIsFullnameEditOpen(false);
                  setIsUsernameEditOpen(false);
                }}
              ></EditIcon>
            </p>
            {isBioEditOpen && (
              <input type="text" placeholder={bio} className="edit-info" />
            )}
          </>
        ) : null}

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
        </div>
      </div>
    </div>
  );
}
