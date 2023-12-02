function FeatureNotAvail({ onCloseModal }) {
  return (
    <>
      <div
        className="delete-post-modal"
        style={{
          padding: "1rem 0",
          height: "6.7rem",
          justifyContent: "space-between",
        }}
      >
        <h3
          style={{
            borderBottom: "1px solid rgb(0, 0, 0, 0.2)",
            paddingBottom: "0.7rem",
            marginBottom: "0",
          }}
        >
          Notice
        </h3>

        <p style={{ fontSize: "0.9rem" }}>This feature is not yet available!</p>
        <div
          className="delete"
          style={{ position: "absolute", top: "1.2rem", right: "1.2rem" }}
          onClick={onCloseModal}
        ></div>
      </div>
    </>
  );
}

export default FeatureNotAvail;
