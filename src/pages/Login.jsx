import { useContext, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Context } from "../context/authContext";
import { useEffect } from "react";

const API_BASE = window.location.hostname.includes('localhost') 
  ? 'http://localhost:5000' 
  : 'https://your-backend-app.vercel.app';

function Login() {
    const [DATA, setDATA] = useState({
        email: "",
        password: ""
    })
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const { user, loading: authLoading } = useContext(Context);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDATA((prev) => ({ ...prev, [name]: value }));
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await axios.post(
                `${API_BASE}/api/user/login`,
                DATA,
                { withCredentials: true }
            );

            if (res.status === 200 && res.data.data) {
                const userData = {
                    email: res.data.data.email,
                    role: res.data.data.role,
                    userId: res.data.data.id,
                    tenant: res.data.data.tenant 
                };
                
                localStorage.setItem("user", JSON.stringify(userData));
                window.location.href = "/notes";
            }
        } catch (err) {
            setError(err.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && !authLoading) {
            navigate("/notes");
        }
    }, [user, authLoading, navigate]);

    if (authLoading) {
        return (
            <div className="d-flex vh-100 justify-content-center align-items-center">
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Checking authentication...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="d-flex vh-100 justify-content-center align-items-center">
            <div className="card shadow-lg p-4" style={{ width: "400px" }}>
                <h3 className="text-center mb-4">Login</h3>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            name="email"
                            value={DATA.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            name="password"
                            value={DATA.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary w-100"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="mt-4">
                    <h6 className="text-center">Test Accounts:</h6>
                    <div className="small text-muted">
                        <div>admin@acme.test / password (Admin)</div>
                        <div>user@acme.test / password (Member)</div>
                        <div>admin@globex.test / password (Admin)</div>
                        <div>user@globex.test / password (Member)</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;