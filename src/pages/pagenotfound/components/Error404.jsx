import { useEffect, useState } from "react";
import "../stylesheets/Error404.css";

export default function Error404() {
  const [emoticon, setEmoticon] = useState("");
  const randomEmoticon = () => {
    const randomNumber = Math.floor(Math.random() * 10) + 1;
    switch (randomNumber) {
      case 1:
        return "(⁠っ⁠˘̩⁠╭⁠╮⁠˘̩⁠)⁠っ";
      case 2:
        return ".⁠·⁠´⁠¯⁠`⁠(⁠>⁠▂⁠<⁠)⁠´⁠¯⁠`⁠·⁠.";
      case 3:
        return "(⁠ ⁠≧⁠Д⁠≦⁠)";
      case 4:
        return "｡⁠:ﾟ⁠(⁠;⁠´⁠∩⁠`⁠;⁠)ﾟ⁠:⁠｡";
      case 5:
        return "(⁠๑⁠´⁠•⁠.̫⁠ ⁠•⁠ ⁠`⁠๑)⁠";
      case 6:
        return "(⁠-̩̩̩⁠-̩̩̩⁠-̩̩̩⁠-̩̩̩⁠-̩̩̩⁠_⁠_⁠_⁠-̩̩̩⁠-̩̩̩⁠-̩̩̩⁠-̩̩̩⁠-̩̩̩⁠)";
      case 7:
        return "༎ຶ⁠‿⁠༎ຶ";
      case 8:
        return "(⁠｡⁠ﾉ⁠ω⁠＼⁠｡⁠)";
      case 9:
        return "(⁠｡⁠•́⁠︿⁠•̀⁠｡⁠)";
      case 10:
        return "(⁠〒⁠﹏⁠〒⁠)";
    }
  };

  useEffect(() => {
    setEmoticon(randomEmoticon());
  }, []);

  return (
    <div className="error-page-background">
      <div className="error-msg-container">
        <h2 className="error">
          OOPS!
          <br />
          {emoticon}
        </h2>
        <p className="error-content">
          We’re very sorry for the inconvenience. Looks like your trying to
          <br />
          access a page that has been deleted or have never existed
        </p>
        <button
          className="--chip active-chip homepage-btn"
          onClick={() => {
            location.href = "/";
          }}
        >
          GO BACK TO HOME PAGE
        </button>
      </div>
    </div>
  );
}
