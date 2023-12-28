function SupportUs({ onCloseModal }) {
  let windowsWidth = window.innerWidth;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: windowsWidth > 700 ? "40rem" : "95%",
        height: "23rem",
        backgroundColor: "white",
        borderRadius: "1rem",
        padding: "1rem 0",
        zIndex: "2",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          paddingBottom: "0.8rem",
          marginBottom: "1rem",
          borderBottom: "1px solid rgb(0, 0, 0, 0.2)",
        }}
      >
        Support DOS
      </h2>
      <div
        style={{
          padding: "0 1.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div className="gcash"></div>
        <p style={{ fontSize: "0.8rem", textAlign: "justify" }}>
          Your generous GCASH donations will play a vital role in advancing the
          development of our platform, ensuring its seamless operation.
          Additionally, your support will enable us to{" "}
          <b>
            maintain our domain, expand our database capacity, and enhance our
            storage capabilities.
          </b>{" "}
          Your contributions are instrumental in making our vision a reality and
          are deeply appreciated.
        </p>
      </div>
      <div
        className="delete"
        style={{ position: "absolute", top: "1.3rem", right: "1.3rem" }}
        onClick={onCloseModal}
      ></div>
    </div>
  );
}

export default SupportUs;
