import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard/components/Dashboard";
import Userprofile from "./pages/userprofile/components/Userprofile";
import Login from "./pages/login/components/Login";
import Error404 from "./pages/pagenotfound/components/Error404";
import DosAnnouncement from "./pages/DOSAnnouncement/DosAnnouncement";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import axios from "axios";

export const URL = import.meta.env.VITE_SERVER_URL;

function App() {
  const token = Cookies.get("token");
  const [user, setUser] = useState([]);

  const verifyToken = async () => {
    try {
      await axios.get(`${URL}/jwt/token`, {
        headers: {
          Authorization: token,
        },
      });
    } catch (err) {
      if (
        err.response.request.status === 401 ||
        err.response.request.status === 403
      ) {
        Cookies.remove("token");
        location.href = "/login";
        return console.error(err.response.data.message);
      } else return console.error(err.response.data.message);
    }
  };

  const decodeUser = () => {
    verifyToken();
    const User = jwtDecode(token);
    const parsedUser = JSON.parse(User.user);

    setUser(parsedUser);
  };

  useEffect(() => {
    if (token) decodeUser();
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={token ? <Dashboard user={user} /> : <Login />}
        />
        <Route
          path="/login"
          element={token ? <Dashboard user={user} /> : <Login />}
        />
        <Route
          path="/signup"
          element={token ? <Dashboard user={user} /> : <Login />}
        />
        <Route
          path="/home"
          element={token ? <Dashboard user={user} /> : <Login />}
        />
        <Route
          path="/dashboard"
          element={token ? <Dashboard user={user} /> : <Login />}
        />
        <Route
          path="/dosboard"
          element={token ? <Dashboard user={user} /> : <Login />}
        />
        <Route
          path="/announcement"
          element={token ? <DosAnnouncement user={user} /> : <Login />}
        />
        <Route
          path="/:username"
          element={token ? <Userprofile userLoggedIn={user} /> : <Login />}
        />
        <Route path="*" element={<Error404 />} />
      </Routes>
    </Router>
  );
}

export default App;
