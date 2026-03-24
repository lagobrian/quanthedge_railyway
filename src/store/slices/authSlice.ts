import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE } from '@/lib/api';

interface User {
  id: number;
  email: string;
  username?: string;
  full_name?: string;
  is_premium?: boolean;
  is_author?: boolean;
  is_analyst?: boolean;
  image?: string;
  avatar_url?: string;
  bio?: string;
  about?: string;
  country?: string;
  twitter?: string;
  linkedin?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
};

export const refreshUser = createAsyncThunk('auth/refreshUser', async (_, { rejectWithValue }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (!token) return rejectWithValue('No token');

  const res = await fetch(API_BASE + '/api/profile/', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return rejectWithValue('Invalid token');
  return await res.json();
});

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { dispatch, rejectWithValue }) => {
    const res = await fetch(API_BASE + '/api/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return rejectWithValue('Login failed');
    const data = await res.json();
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    await dispatch(refreshUser());
    return true;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(refreshUser.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.loading = false;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(login.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
