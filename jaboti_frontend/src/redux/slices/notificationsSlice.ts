import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type Severity = 'success' | 'error' | 'info' | 'warning';

interface NotificationsState {
  open: boolean;
  message: string;
  severity: Severity;
}

const initialState: NotificationsState = {
  open: false,
  message: '',
  severity: 'info',
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    showSnackbar: (state, action: PayloadAction<{ message: string; severity?: Severity }>) => {
      state.open = true;
      state.message = action.payload.message;
      state.severity = action.payload.severity || 'info';
    },
    hideSnackbar: (state) => {
      state.open = false;
    },
  },
});

export const { showSnackbar, hideSnackbar } = notificationsSlice.actions;
export default notificationsSlice.reducer;
