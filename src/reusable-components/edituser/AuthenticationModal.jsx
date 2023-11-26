import { useState } from "react";
import "./AuthenticationModal.css";
import axios from "axios";
import Cookies from "js-cookie";
import EditPasswordModal from "./EditPasswordModal";
import { URL } from "../../App";

export default function AuthenticationModal({
  onCloseAuthentication,
  email,
  recoverUserId,
}) {
  const userId = recoverUserId ? recoverUserId : Cookies.get("userId");
  const [message, setMessage] = useState(
    recoverUserId
      ? `Send a verification code to
       ${obfuscateEmail(email)} to confirm your identity
       and recover your account.`
      : `Send a verification code to ${email} to confirm it's you before changing your password.`
  );
  const [buttonMsg, setButtonMsg] = useState("SEND");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeSending, setCodeSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  function obfuscateEmail(email) {
    // Split the email address into local part and domain part
    const [localPart, domainPart] = email.split("@");

    // Hide characters in the local part
    const maskedLocalPart =
      localPart.substring(0, 1) +
      "*".repeat(localPart.length - 2) +
      localPart.slice(-1);

    // Hide characters in the domain part
    const maskedDomainPart =
      domainPart.substring(0, 1) +
      "*".repeat(domainPart.length - 2) +
      domainPart.slice(-1);

    // Construct the masked email address
    const maskedEmail = maskedLocalPart + "@" + maskedDomainPart;

    return maskedEmail;
  }

  const handleSendEmail = async () => {
    setErrMsg("");
    setSuccessMsg("");
    if (codeSending) return;
    if (codeSent) return;
    setCodeSending(true);
    setButtonMsg("SENDING");
    try {
      const emailRes = await axios.put(`
      ${URL}/mail/verification/${userId}
            `);
      setVerificationCode(emailRes.data.verificationToken);
      setMessage(`Please verify your identity by using the
      code sent to you.`);
      setCodeSent(true);
      setButtonMsg("VERIFY");
      setSuccessMsg("Code Sent Successfully");
    } catch (err) {
      setErrMsg(err.data);
      return console.error(err);
    } finally {
      setCodeSending(false);
    }
  };

  const handleVerify = async () => {
    setErrMsg("");
    setSuccessMsg("");
    if (verifying) return;
    if (!codeSent) return;
    if (codeInput !== verificationCode) return setErrMsg("Incorrect Code");
    setCodeSending(true);
    try {
      const verifyRes = await axios.get(`
      ${URL}/verify/account?token=${verificationCode}
            `);
      if (
        verifyRes.data.message === "Account Successfully Verified" ||
        verifyRes.data.message === "Account is already Verified"
      ) {
        setSuccessMsg("Verified Successfully");
        setTimeout(() => {
          setVerified(true);
        }, 1000);
      } else {
        return setErrMsg(verifyRes.data.message);
      }
    } catch (err) {
      setErrMsg(err.data);
      return console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  if (verified) {
    return (
      <EditPasswordModal
        onCloseModal={() => onCloseAuthentication()}
        recoverUserId={recoverUserId}
      />
    );
  } else {
    return (
      <div className="authentication-modal">
        <h2 className="authentication-header">
          {recoverUserId ? "Recover Account" : "Authentication"}
        </h2>
        <div className="code-container">
          {message.split("\n").map((line, index) => (
            <p
              key={index}
              className={"code-text"}
              style={{ fontSize: "0.95rem" }}
            >
              {line}
            </p>
          ))}
          {/* {message} */}
          {codeSent && (
            <input
              type="text"
              className="code-field"
              placeholder="Enter your code here"
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value);
              }}
            />
          )}

          <div style={{ height: "1rem" }}>
            {errMsg.length > 0 && (
              <p style={{ fontSize: "0.85rem", color: "red", height: "1rem" }}>
                {errMsg}
              </p>
            )}
            {successMsg.length > 0 && (
              <p
                style={{ fontSize: "0.85rem", color: "green", height: "1rem" }}
              >
                {successMsg}
              </p>
            )}
          </div>
          <br />
          <button
            className="submit-authentication"
            onClick={() => {
              codeSent ? handleVerify() : handleSendEmail();
            }}
          >
            {buttonMsg}
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
}
