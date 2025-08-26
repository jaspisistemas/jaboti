import { configureStore } from '@reduxjs/toolkit'; // store config
import { combineReducers } from 'redux';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Exemplo de slice de autenticação
import authReducer from './slices/authSlice';
import departmentsReducer from './slices/departmentsSlice';
import pessoasReducer from './slices/pessoasSlice';
import companiesReducer from './slices/companiesSlice';
import notificationsReducer from './slices/notificationsSlice';
import chatsReducer from '../features/atendimento/slices/chatsSlice';
import messagesReducer from '../features/atendimento/slices/messagesSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  departments: departmentsReducer,
  pessoas: pessoasReducer,
  companies: companiesReducer,
  notifications: notificationsReducer,
  chats: chatsReducer,
  messages: messagesReducer,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'departments'], // Evitar persistir listas dinâmicas (pessoas, companies)
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

import type { PersistPartial } from 'redux-persist/es/persistReducer';

export type RootState = ReturnType<typeof rootReducer> & PersistPartial;
export type AppDispatch = typeof store.dispatch;
