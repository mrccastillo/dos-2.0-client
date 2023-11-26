import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import "../stylesheets/Login.css";
import axios from "axios";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { jwtDecode } from "jwt-decode";
import AuthenticationModal from "../../../reusable-components/edituser/AuthenticationModal";
import { URL } from "../../../App";

export default function Login({}) {
  const storedUsernameOrEmail = Cookies.get("emailOrUsername");
  const storedValue = localStorage.getItem("isInSignInPage");
  const [isInSignInPage, setIsInSignInPage] = useState(
    storedValue === null ? true : JSON.parse(storedValue)
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [steps, setSteps] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [signUpBtnMsg, setSignUpBtnMsg] = useState("NEXT");
  const [loginBtnMsg, setLoginBtnMsg] = useState("LOG IN");

  //controlled elements
  //login
  const [usernameOrEmail, setUsernameOrEmail] = useState(
    storedUsernameOrEmail ? storedUsernameOrEmail : ""
  );
  const [isRememberMe, setIsRememberMe] = useState(false);

  //signup
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [firstName, setFisrtName] = useState("");
  const [lastName, setLastName] = useState("");
  const [section, setSection] = useState();
  const [userId, setUserId] = useState("");
  const [code, setCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  //Recover Account
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverUserId, setRecoverUserId] = useState("");

  function validate_email(email) {
    let expression = /^[^@]+@\w+(\.\w+)+\w$/;
    if (expression.test(email) == true) {
      return true;
    } else {
      return false;
    }
  }

  async function handleSignUpSubmit(e) {
    e.preventDefault();
    if (steps === 0) {
      setErrorMsg("");
      //don't proceed to next step when form is not filled out

      if (!email || !username || !password || !confirmPass) {
        setErrorMsg("Please fill out the fields.");
        return;
      } else if (
        username === "admin" ||
        username === "Admin" ||
        username === "dashboard" ||
        username === "Dashboard" ||
        username === "dosboard" ||
        username === "Dosboard" ||
        username === "login" ||
        username === "Login"
      ) {
        setErrorMsg("Invalid Username");
        return;
      } else if (!validate_email(email)) {
        setErrorMsg("Invalid Email");
        return;
      } else if (password.length < 6) {
        setErrorMsg("Password should be atleast 6 characters.");
        return;
      } else if (username.length < 3) {
        setErrorMsg("Username should be atleast 3 characters.");
        return;
      } else if (password !== confirmPass) {
        setErrorMsg("Password didn't match.");
        return;
      } else {
        const newUser = {
          username: username,
          email: email,
          password: password,
        };
        setSignUpBtnMsg("Signing you up...");
        try {
          const res = await axios.post(`${URL}/auth/signup`, newUser);
          if (res.data.message === "Signed Up Successfully") {
            setUserId(res.data.id);
            Cookies.set("tempToken", res.data.token, {
              expires: 24 * 60 * 60,
            }); // 1 day expiration
          }
        } catch (err) {
          console.error(err);
          setSignUpBtnMsg("NEXT");
          if (err.response.data.err.keyValue.email)
            return setErrorMsg("Email already in use.");
          else if (err.response.data.err.keyValue.username)
            return setErrorMsg("Username is taken.");
          return setErrorMsg(err);
        }
      }
      setSteps((prevStep) => prevStep + 1);
      setSignUpBtnMsg("NEXT");
    } else if (steps === 1) {
      if (!firstName || !lastName || section === undefined)
        return setErrorMsg("Please fill out the fields");
      else if (firstName.length < 2 || lastName.length < 2) {
        return setErrorMsg(
          "First Name and Last Name should be atleast 2 characters"
        );
      } else {
        const user = {
          firstname: firstName,
          lastname: lastName,
          section: section,
        };
        setSignUpBtnMsg("Sending you a code...");
        try {
          const res = await axios.put(`${URL}/user/${userId}`, user, {
            headers: {
              Authorization: Cookies.get("tempToken"),
            },
          });
          Cookies.set("tempToken", res.data.token, {
            expires: 24 * 60 * 60,
          }); // 1 day expiration
          if (res.data.message === "Account Successfully Updated") {
            const emailRes = await axios.put(`
            ${URL}/mail/signup/${userId}
            `);
            setVerificationCode(emailRes.data.verificationToken);
            setSteps((prevStep) => prevStep + 1);
          }
        } catch (err) {
          setSignUpBtnMsg("NEXT");
          setErrorMsg(err);
          return console.error(err);
        }
      }
      setSignUpBtnMsg("CONFIRM");
    } else if (steps === 2) {
      if (!code) {
        setErrorMsg("Please enter the code sent to your email address");
        return;
      } else if (code !== verificationCode) {
        setErrorMsg("Invalid verification code");

        return;
      } else {
        setSignUpBtnMsg("Creating your account...");
        const verifyRes = await axios.get(`
        ${URL}/verify/email?token=${code}
        `);

        if (
          verifyRes.data.message === "Email Successfully Verified" ||
          verifyRes.data.message === "Account Email already verified"
        ) {
          Cookies.set("token", Cookies.get("tempToken"));
          Cookies.remove("tempToken");
          setIsLoggedIn(true);
        }
      }
      setEmail("");
      setUsername("");
      setPassword("");
      setConfirmPass("");
      setFisrtName("");
      setLastName("");
      setSection("");
      setCode("");
      setErrorMsg("");
      setSignUpBtnMsg("NEXT");
    }
  }

  async function handleLogInSubmit(e) {
    setErrorMsg("");
    setSuccessMsg("");
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      setErrorMsg("Please fill out the fields");
      return;
    }

    const user = {
      emailOrUsername: usernameOrEmail,
      password: password,
    };

    try {
      setLoginBtnMsg("LOGGING IN");
      const res = await axios.post(`${URL}/auth/login`, user);
      const User = jwtDecode(res.data.token);
      const parsedUser = JSON.parse(User.user);

      if (parsedUser.nameValid && parsedUser.emailValid) {
        Cookies.set("token", res.data.token, { expires: 30 * 24 * 60 * 60 }); // 30 day expiration
        Cookies.set("userId", parsedUser._id, { expires: 30 * 24 * 60 * 60 }); // 30 day expiration
        if (isRememberMe)
          Cookies.set("emailOrUsername", usernameOrEmail, {
            expires: 30 * 24 * 60 * 60,
          });
        setSuccessMsg("Logged In Successfully");
        setTimeout(() => {
          setIsLoggedIn(true);
        }, 1000);
      } else if (!parsedUser.nameValid) {
        Cookies.set("tempToken", res.data.token, {
          expires: 24 * 60 * 60,
        }); // 1 day expiration
        setUserId(parsedUser._id);
        setIsInSignInPage(!isInSignInPage);
        setSteps(1);
        setEmail(parsedUser.email);
        setUsername(parsedUser.username);
        setErrorMsg("");
      } else if (!parsedUser.emailValid) {
        Cookies.set("tempToken", res.data.token, {
          expires: 24 * 60 * 60,
        }); // 1 day expiration
        setUserId(parsedUser._id);
        try {
          const emailRes = await axios.put(`
          ${URL}/mail/signup/${userId}
            `);
          setVerificationCode(emailRes.data.verificationToken);
        } catch (err) {
          return console.error(err);
        }
        setIsInSignInPage(!isInSignInPage);
        setSteps(2);
        setEmail(parsedUser.email);
        setUsername(parsedUser.username);
        setCode("");
      }
    } catch (err) {
      setLoginBtnMsg("LOG IN");
      return setErrorMsg(err.response.data.message);
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const user = await axios.get(
        `${URL}/auth/find?account=${usernameOrEmail}`
      );

      if (user.status === 200) {
        setSuccessMsg("User Found!");
        setRecoverEmail(user.data.other.email);
        setRecoverUserId(user.data.other._id);
        setTimeout(() => {
          setIsAuthModalOpen(true);
        }, 1000);
      } else {
        setErrorMsg("User not found");
      }
    } catch (err) {
      return console.error(err);
    }
  }

  useEffect(() => {
    localStorage.setItem("isInSignInPage", isInSignInPage);
  }, [isInSignInPage]);

  if (isLoggedIn) {
    return (location.href = "/");
  } else {
    return (
      <HelmetProvider>
        <Helmet>
          <title>DOS</title>
          <meta property="og:title" content="Login or Sign up" />
        </Helmet>
        <div className="login-background">
          <div className="login-page" style={{ position: "relative" }}>
            <div
              className="login-form-container"
              style={{
                left: isInSignInPage /* && isInDesktop*/ ? 0 : "100%",
                transform: !isInSignInPage && "translateX(-100%)",
                position: "absolute",
                transition: "300ms ease-out ",
              }}
            >
              <form className="login-form">
                <div className="form-fields-container">
                  <h1 className="form-header">
                    {isInSignInPage ? "Hello World!" : "Create Account"}
                  </h1>
                  <p className="form-subheader">
                    {isForgotPassword
                      ? "Recover your Account"
                      : isInSignInPage
                      ? "Sign into your DOS Account"
                      : "Join DOS Now!"}
                  </p>
                  {steps === 0 ? (
                    <>
                      {isInSignInPage && (
                        <input
                          type="text"
                          className="login-input --white-btn"
                          style={{
                            borderColor: "#4f709c",
                            backgroundColor: "white",
                            color: "#000",
                          }}
                          value={usernameOrEmail}
                          onChange={(e) => {
                            setUsernameOrEmail(e.target.value);
                          }}
                          placeholder="Enter your username or email "
                          required
                        />
                      )}
                      {!isInSignInPage && (
                        <>
                          <input
                            type="text"
                            className="login-input --white-btn"
                            style={{
                              borderColor: "#4f709c",
                              backgroundColor: "white",
                              color: "#000",
                            }}
                            value={username}
                            onChange={(e) => {
                              setUsername(e.target.value);
                            }}
                            placeholder="Enter your username  "
                          />
                          <input
                            type="text"
                            className="login-input --white-btn"
                            style={{
                              borderColor: "#4f709c",
                              backgroundColor: "white",
                              color: "#000",
                            }}
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                            }}
                            placeholder="Enter your email "
                          />
                        </>
                      )}
                      {!isForgotPassword && (
                        <input
                          type="password"
                          className="login-input --white-btn"
                          style={{
                            borderColor: "#4f709c",
                            backgroundColor: "white",
                            color: "#000",
                          }}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                          }}
                          placeholder="Enter your password"
                        />
                      )}
                      {!isInSignInPage && (
                        <input
                          type="text"
                          className="login-input --white-btn"
                          style={{
                            borderColor: "#4f709c",
                            backgroundColor: "white",
                            color: "#000",
                          }}
                          value={confirmPass}
                          onChange={(e) => {
                            setConfirmPass(e.target.value);
                          }}
                          placeholder="Confirm Password  "
                        />
                      )}
                    </>
                  ) : steps === 1 ? (
                    <>
                      <input
                        type="text"
                        className="login-input --white-btn"
                        style={{
                          borderColor: "#4f709c",
                          backgroundColor: "white",
                          color: "#000",
                        }}
                        value={firstName}
                        onChange={(e) => {
                          setFisrtName(e.target.value);
                        }}
                        placeholder="First Name"
                      />
                      {!isInSignInPage && (
                        <input
                          type="text"
                          className="login-input --white-btn"
                          style={{
                            borderColor: "#4f709c",
                            backgroundColor: "white",
                            color: "#000",
                          }}
                          value={lastName}
                          onChange={(e) => {
                            setLastName(e.target.value);
                          }}
                          placeholder="Last Name"
                        />
                      )}
                      <select
                        className="select login-input --white-btn"
                        style={{
                          borderColor: "#4f709c",
                          backgroundColor: "white",
                          color: "#000",
                        }}
                        value={section}
                        onChange={(e) => {
                          setSection(e.target.value);
                        }}
                      >
                        <option value={null}>Section</option>
                        <option value={0}>Outsider</option>
                        <option value={1}>ICT 12 - 1</option>
                        <option value={2}>ICT 12 - 2</option>
                        <option value={3}>PUPian</option>
                      </select>
                    </>
                  ) : (
                    steps >= 2 && (
                      <>
                        <p className="signin-text">
                          Enter the code sent to {email}
                          <br />
                          to finalize your account.
                        </p>
                        <input
                          type="text"
                          className="login-input --white-btn"
                          style={{
                            borderColor: "#4f709c",
                            backgroundColor: "white",
                            color: "#000",
                          }}
                          value={code}
                          onChange={(e) => {
                            setCode(e.target.value);
                          }}
                          placeholder="Code"
                        />
                      </>
                    )
                  )}

                  <div className="utils-container">
                    {isInSignInPage && (
                      <>
                        <div>
                          {!isForgotPassword && (
                            <>
                              <input
                                type="checkbox"
                                name="isRememberMe"
                                id="remember-me"
                                value={isRememberMe}
                                onChange={(e) => {
                                  setIsRememberMe(e.target.checked);
                                }}
                              />
                              <label htmlFor="remember-me">Remember Me</label>
                            </>
                          )}
                        </div>
                        <p
                          style={{ cursor: "pointer" }}
                          onClick={() => setIsForgotPassword(!isForgotPassword)}
                        >
                          {!isForgotPassword
                            ? "Forgot Password"
                            : "Go back Login"}
                        </p>
                      </>
                    )}
                  </div>
                  <p className="--server-msg">{errorMsg}</p>
                  <p className="--server-success-msg">{successMsg}</p>
                </div>
                {isForgotPassword ? (
                  <button className="--blue-btn" onClick={handleForgotPassword}>
                    FIND
                  </button>
                ) : isInSignInPage ? (
                  <button className="--blue-btn" onClick={handleLogInSubmit}>
                    {loginBtnMsg}
                  </button>
                ) : (
                  <button className="--blue-btn" onClick={handleSignUpSubmit}>
                    {signUpBtnMsg}
                  </button>
                )}
              </form>
            </div>
            <div
              className="login-message-container"
              style={{
                right: isInSignInPage ? 0 : "100%",
                transform: !isInSignInPage && "translateX(100%)",
                position: "absolute",
                transition: "300ms ease-out",
              }}
            >
              <div className="message-container">
                <h2 className="message-header">
                  {isInSignInPage ? "Welcome Back!" : "Welcome to DOS"}
                </h2>
                <p className="message-content">
                  {isInSignInPage
                    ? "DOS, a dynamic and engaging platform designed for PUPSHS Students. With a friendly interface, a safe, moderated environment, DOS is the perfect space to share your thoughts and connect with your fellow students. Whether you want to post anonymously or publicly, DOS offers a variety of ways to share your personal reflections, funny anecdotes, or motivational messages. With the ability to post announcements, DOS is also a valuable tool to help keep everyone in the loop."
                    : "New to DOS? Create an account now and experience a dynamic and engaging platform designed for PUPSHS Students. With a friendly interface, a safe, moderated environment, DOS is the perfect space to share your thoughts and connect with your fellow students. Whether you want to post anonymously or publicly, DOS offers a variety of ways to share your personal reflections, funny anecdotes, or motivational messages. With the ability to post announcements, DOS is also a valuable tool to help keep everyone in the loop. So why not join DOS today?"}
                </p>
              </div>
              <div className="not-signedin-container">
                <p className="not-signedin-container-label">
                  {isInSignInPage
                    ? " Not yet joined with DOS?"
                    : "Already have an account?"}
                </p>
                <button
                  className="--white-btn"
                  onClick={() => {
                    setIsInSignInPage(!isInSignInPage);
                    setSteps(0);
                    setEmail("");
                    setUsername("");
                    setPassword("");
                    setFisrtName("");
                    setLastName("");
                    setSection("");
                    setCode("");
                    setErrorMsg("");
                  }}
                >
                  {isInSignInPage ? " Create an account" : "LOG IN"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {isAuthModalOpen && (
          <>
            <AuthenticationModal
              onCloseAuthentication={() => setIsAuthModalOpen(!isAuthModalOpen)}
              email={recoverEmail}
              recoverUserId={recoverUserId}
            />
          </>
        )}
        {isAuthModalOpen && <div className="overlay"></div>}
      </HelmetProvider>
    );
  }
}
