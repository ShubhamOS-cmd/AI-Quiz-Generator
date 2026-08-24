import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { authApi } from "./services/api";
import { setCredentials, clearCredentials } from "./store/authSlice";
import { Outlet } from "react-router";

import Navbar from "./components/Navbar";
export default function App() {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await authApi.getCurrentUser();
        dispatch(setCredentials(res.data.data));
      } catch (error) {
        dispatch(clearCredentials());
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);
  return loading ? (
    <div className="flex items-center justify-center h-screen">
      <h1>Loading ......... </h1>
    </div>
  ) : (
    <div className="flex flex-col h-screen bg-[#f3f5f7] overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
