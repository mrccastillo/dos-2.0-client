import "./EditUserInfo.css";
import EditIcon from "@mui/icons-material/Edit";
import axios from "axios";
import Cookies from "js-cookie";
import { useState } from "react";

export default function EditUserInfo({
  username,
  fullname,
  bio,
  email,
  onCloseSettings,
}) {
  const token = Cookies.get("token");
  const [fullnameEdit, setFullnameEdit] = useState(fullname);
  const [usernameEdit, setUsernameEdit] = useState(username);
  const [bioEdit, setbioEdit] = useState(bio);
  const [updating, setUpdating] = useState(false);

  const [isFullnameEditOpen, setIsFullnameEditOpen] = useState(false);
  const [isUsernameEditOpen, setIsUsernameEditOpen] = useState(false);
  const [isBioEditOpen, setIsBioEditOpen] = useState(false);

  async function handleUserUpdate() {
    if (updating) return;
    setUpdating(true);
    const user = {
      username: usernameEdit,
      bio: bioEdit,
    };

    try {
      const res = await axios.get(
        `https://backend.dosshs.online/api/user/find?account=${usernameEdit}`,
        {
          headers: {
            Authorization: token,
          },
        }
      );

      if (res.data.other) return alert("Username is taken");
    } catch (err) {
      return console.error(err);
    }

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
      Cookies.set("token", res.data.token, {
        expires: 30 * 24 * 60 * 60,
      }); // 30 day expiration
      alert(res.data.message);
      window.location.reload();
    } catch (err) {
      return console.error(err);
    } finally {
      setUpdating(false);
    }
  }

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
          <input
            type="text"
            // placeholder={fullname}
            className="edit-info"
            value={"BAWAL PA"}
            onChange={(e) => {
              setFullnameEdit(e.target.value);
            }}
          />
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
            <p className="bio">
              "{bio ? bio : "Edit Bio"}"
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
        </div>
      </div>
      <button onClick={handleUserUpdate}>Save Changes</button>
    </div>
  );
}
