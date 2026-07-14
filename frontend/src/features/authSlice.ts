import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  profile_photo: string | null;
  status: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('crm_user') || 'null'),
  token: localStorage.getItem('crm_token'),
  roles: JSON.parse(localStorage.getItem('crm_roles') || '[]'),
  permissions: JSON.parse(localStorage.getItem('crm_permissions') || '[]'),
  isAuthenticated: !!localStorage.getItem('crm_token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user: User; token: string; roles: string[]; permissions: string[] }>
    ) {
      const { user, token, roles, permissions } = action.payload;
      state.user = user;
      state.token = token;
      state.roles = roles;
      state.permissions = permissions;
      state.isAuthenticated = true;

      localStorage.setItem('crm_user', JSON.stringify(user));
      localStorage.setItem('crm_token', token);
      localStorage.setItem('crm_roles', JSON.stringify(roles));
      localStorage.setItem('crm_permissions', JSON.stringify(permissions));
    },
    updateUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      localStorage.setItem('crm_user', JSON.stringify(action.payload));
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.roles = [];
      state.permissions = [];
      state.isAuthenticated = false;

      localStorage.removeItem('crm_user');
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_roles');
      localStorage.removeItem('crm_permissions');
      localStorage.removeItem('crm_session_active');
    },
  },
});

export const { setCredentials, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
