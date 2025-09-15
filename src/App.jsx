import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Notes from "./pages/Notes.jsx"; 
import { useContext } from "react";
import { Context } from "./context/authContext.jsx";

function App() {
  const { user, loading } = useContext(Context);
  
  if (loading) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/notes" /> : <Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/notes" element={<Notes />} />
      </Routes>
    </>
  );
}

export default App;