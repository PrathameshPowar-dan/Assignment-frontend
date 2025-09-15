import axios from "axios";
import { createContext, useEffect, useState } from "react";

const API_BASE = window.location.hostname.includes('localhost') 
  ? 'http://localhost:5000' 
  : 'https://your-backend-app.vercel.app';

export const Context = createContext(null);

export const ContextProvider = (props) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const CheckAuth = async () => {
        try {
            const response = await axios.get(`${API_BASE}/api/user/check`, {
                withCredentials: true,
            });
            
            if (response.data.success && response.data.data) {
                const userData = {
                    email: response.data.data.email,
                    role: response.data.data.role,
                    userId: response.data.data._id,
                    tenant: response.data.data.tenantId
                };
                
                setUser(userData);
                localStorage.setItem("user", JSON.stringify(userData));
                setLoading(false);
                return userData;
            } else {
                setUser(null);
                localStorage.removeItem("user");
                setLoading(false);
                return null;
            }
        } catch (error) {
            console.log("Error in CheckAuth:", error);
            setUser(null);
            localStorage.removeItem("user");
            setLoading(false);
            return null;
        }
    }

    const logout = async () => {
        try {
            await axios.post(`${API_BASE}/api/user/logout`, {}, {
                withCredentials: true
            });
        } catch (error) {
            console.log("Logout error:", error);
        } finally {
            setUser(null);
            localStorage.removeItem("user");
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        
        CheckAuth();
    }, []);

    const value = { user, setUser, CheckAuth, logout, loading };

    return (
        <Context.Provider value={value}>
            {props.children}
        </Context.Provider>
    );
}