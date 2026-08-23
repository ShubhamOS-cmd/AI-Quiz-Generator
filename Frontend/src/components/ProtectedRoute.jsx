import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children , authentication=true }) {
 const navigate = useNavigate();
 const authStatus = useSelector(state => state.auth.isAuthenticated);
 useEffect(() => {
  if(authentication && !authStatus){
    navigate("/login");
  }
  else if(!authentication && authStatus){
    navigate("/");
  }
 } , [authStatus , navigate , authentication]);
 return children
}
