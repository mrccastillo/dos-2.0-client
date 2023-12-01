import { useState } from "react";
import "./ReportPost.css";
import axios from "axios";
import Cookies from "js-cookie";
import { URL } from "../../App";

function ReportPost({ postId, onCloseReport }) {
  const token = Cookies.get("token");
  const userId = Cookies.get("userId");
  const [inputData, setInputData] = useState("");
  const [isOthersOpen, setIsOthersOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [reportType, setReportType] = useState(0);
  const [errMsg, setErrMsg] = useState("");

  function handleReportChange(type) {
    setErrMsg();
    if (type === 0) setIsOthersOpen(true);
    else setIsOthersOpen(false);
    setReportType(type);
  }

  const submitReport = async () => {
    setErrMsg();
    if (reportType === 0 && inputData === "")
      return setErrMsg("Please specify");

    const report = {
      userId: userId,
      postId: postId,
      reportCategory: reportType,
    };

    if (reportType === 0) report.reportContent = inputData;

    try {
      await axios.post(`${URL}/post/report`, report, {
        headers: {
          Authorization: token,
        },
      });
      setIsSuccess(true);
    } catch (err) {
      return console.error(err);
    }
  };

  return (
    <>
      <div className="report-post-modal">
        <h2 className="report-post-header">Report</h2>
        {!isSuccess ? (
          <div className="report-post-inputs">
            <div>
              <p style={{ fontSize: "0.9rem", textAlign: "start" }}>
                Select problem that you have encountered:
              </p>
              <div className="report-inputs">
                <input
                  type="radio"
                  id="violence"
                  onChange={() => handleReportChange(1)}
                  name="report"
                />
                <label htmlFor="violence">Violence</label>
              </div>
              <div className="report-inputs">
                <input
                  type="radio"
                  id="harrassments"
                  onChange={() => handleReportChange(2)}
                  name="report"
                />
                <label htmlFor="harrassments">Harrassments</label>
              </div>
              <div className="report-inputs">
                <input
                  type="radio"
                  id="suicide"
                  onChange={() => handleReportChange(3)}
                  name="report"
                />
                <label htmlFor="suicide">Suicide</label>
              </div>
              <div className="report-inputs">
                <input
                  type="radio"
                  id="false-information"
                  onChange={() => handleReportChange(4)}
                  name="report"
                />
                <label htmlFor="false-information">False Information</label>
              </div>
              <div className="report-inputs">
                <input
                  type="radio"
                  id="spam"
                  onChange={() => handleReportChange(5)}
                  name="report"
                />
                <label htmlFor="spam">Spam</label>
              </div>
              <div className="report-inputs">
                <input
                  type="radio"
                  id="hate"
                  onChange={() => handleReportChange(6)}
                  name="report"
                />
                <label htmlFor="hate">Hate Speech</label>
              </div>
              <div className="report-inputs">
                <input
                  type="radio"
                  id="abuse"
                  onChange={() => handleReportChange(7)}
                  name="report"
                />
                <label htmlFor="abuse">Abuse</label>
              </div>
              <div className="report-inputs">
                <input
                  type="radio"
                  id="something-else"
                  name="report"
                  onChange={() => handleReportChange(0)}
                />
                <label htmlFor="something-else">
                  Something else, please specify
                </label>
                {isOthersOpen && (
                  <input
                    type="text"
                    placeholder="Enter"
                    className="others-input"
                    name="others"
                    value={inputData}
                    onChange={(e) => {
                      setInputData(e.target.value);
                    }}
                  />
                )}
              </div>
              <p className="--server-msg">{errMsg}</p>
            </div>
            <button
              style={{
                height: "2rem",
                width: "12rem",
                backgroundColor: "#FF6565",
                color: "white",
                border: 0,
                borderRadius: "1rem",
                alignSelf: "center",
              }}
              onClick={() => {
                submitReport();
              }}
            >
              Submit
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div className="success-image"></div>
              <h2 style={{ marginBottom: "0.5rem" }}>
                {" "}
                Successfully Submitted!
              </h2>
              <p style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                We will notify the DOS Team about your concern.
              </p>
              <p
                style={{
                  fontWeight: "700",
                  fontSize: "0.85rem",
                  marginBottom: "0.5rem",
                }}
              >
                THANK YOU FOR KEEPING DOS A SAFE PLACE!
              </p>
              <div className="roblox-face"></div>
              <button
                className="save-user-changes"
                style={{ border: "0" }}
                onClick={onCloseReport}
              >
                Close
              </button>
            </div>
          </>
        )}

        <div
          className="delete"
          style={{ position: "absolute", top: "1.5rem", right: "1.5rem" }}
          onClick={onCloseReport}
        ></div>
      </div>
    </>
  );
}

export default ReportPost;
