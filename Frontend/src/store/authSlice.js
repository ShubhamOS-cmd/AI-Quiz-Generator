import { createSlice } from '@reduxjs/toolkit';

const initialToken = localStorage.getItem('accessToken') || null;
const initialUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

const initialState = {
  user: initialUser,
  accessToken: initialToken,
  isAuthenticated: !!initialToken,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;
      state.user = user || state.user;
      state.accessToken = accessToken || state.accessToken;
      state.isAuthenticated = true;
      state.error = null;
      if (accessToken) localStorage.setItem('accessToken', accessToken);
      if (user) localStorage.setItem('user', JSON.stringify(user));
    },
    updateUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    },
    setAuthLoading: (state, action) => {
      state.loading = action.payload;
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
    },
    clearCredentials: (state) => {
  state.user = null;
  state.accessToken = null;
  state.isAuthenticated = false;
  state.error = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  },
  },
});

<<<<<<< HEAD
export const { setCredentials, updateUser, logout, setAuthLoading, setAuthError  } = authSlice.actions;
=======
export const { setCredentials, updateUser, logout, setAuthLoading, setAuthError , clearCredentials } = authSlice.actions;
>>>>>>> 88cfb666c04db33a54dee298329599369c5a21d4

export default authSlice.reducer;
