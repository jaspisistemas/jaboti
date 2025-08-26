import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { onAuthFailure, triggerAuthFailure, onCompanyRequired } from '../auth/events';
import { logout } from '../redux/slices/authSlice';
import { showSnackbar } from '../redux/slices/notificationsSlice';
// no boot refresh; interceptor will handle 401s
import { setActiveCompany } from '../api/appContext';
import { debugAuthLog } from '../utils/debug';
import LoginPage from '../pages/EntrarPage';
import DashboardPage from '../pages/PainelPage';
import ChatPage from '../pages/ChatPage';
import DepartmentsPage from '../pages/DepartamentosPage';
import AttendantsPage from '../pages/AtendentesPage';
import SelectCompanyPage from '../pages/SelecionarEmpresaPage';
import CodeChatPage from '../pages/CodeChatPage';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from './ProtectedRoute';
import DepartmentMembersPage from '../pages/VinculosDepartamentosPage';
import type { RootState, AppDispatch } from '../redux/store';
import { selectCompanyAsync } from '../redux/slices/authSlice';
import ContatosPage from '../pages/ContatosPage';
import PerfilPage from '../pages/PerfilPage';

const AppRoutesInner: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const selectedCompany = useSelector((s: RootState) => s.auth.user?.selectedCompany);
  const startedRef = useRef(false);
  useEffect(() => {
    const off = onAuthFailure(() => {
  dispatch(showSnackbar({ message: 'Sessão expirada. Faça login novamente.', severity: 'warning' }));
  dispatch(logout());
      navigate('/login', { replace: true });
    });
    const off2 = onCompanyRequired(() => {
      dispatch(showSnackbar({ message: 'Selecione uma empresa para continuar.', severity: 'info' }));
      navigate('/selecionar-empresa', { replace: true });
    });
    return () => { off(); off2(); };
  }, [dispatch, navigate]);
  // Ao montar, (re)aplica empresa selecionada (se houver), evitando 403 "Active company required"
  useEffect(() => {
    if (startedRef.current) return; // run only once
    startedRef.current = true;
    let cancelled = false;
    const run = async () => {
      try {
        // Se houver empresa previamente selecionada (persistida), garante ativação no backend
  if (!cancelled && selectedCompany != null) {
          // Se já temos algum token (access ou refresh válido), tentamos aplicar a empresa
          const companyId = typeof selectedCompany === 'string' ? Number(selectedCompany) : selectedCompany;
          if (!Number.isNaN(companyId as number)) {
            try {
              // Evita enviar duas vezes em StrictMode: guarda uma flag por empresa na sessionStorage
              const key = `companyApplied:${companyId}`;
              const already = sessionStorage.getItem(key);
              if (!already) {
                debugAuthLog('APPLY COMPANY', { companyId });
                await dispatch(selectCompanyAsync(companyId as number));
                sessionStorage.setItem(key, '1');
              }
            } catch {}
            try { setActiveCompany(companyId as number); } catch {}
          }
        }
      } catch {
        if (!cancelled) triggerAuthFailure();
      } finally {
        // no-op
      }
    };
    run();
    return () => { cancelled = true; };
  }, [dispatch, selectedCompany]);
  return (
    <Routes>
  {/* Rotas em português (mantendo /login como canônico) */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/selecionar-empresa" element={<SelectCompanyPage />} />
  <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
    <Route path="/painel" element={<DashboardPage />} />
    <Route path="/chat" element={<ChatPage />} />
  <Route path="/codechat" element={<CodeChatPage />} />
    <Route path="/departamentos" element={<DepartmentsPage />} />
    <Route path="/vinculos-departamentos" element={<DepartmentMembersPage />} />
    <Route path="/atendentes" element={<AttendantsPage />} />
    <Route path="/contatos" element={<ContatosPage />} />
    <Route path="/perfil" element={<PerfilPage />} />
  </Route>
  {/* Redirects de legacy */}
  <Route path="/entrar" element={<Navigate to="/login" replace />} />
  <Route path="/select-company" element={<Navigate to="/selecionar-empresa" replace />} />
  <Route path="/dashboard" element={<Navigate to="/painel" replace />} />
  <Route path="/departments" element={<Navigate to="/departamentos" replace />} />
  <Route path="/department-members" element={<Navigate to="/vinculos-departamentos" replace />} />
  <Route path="/attendants" element={<Navigate to="/atendentes" replace />} />
  <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const AppRoutes: React.FC = () => (
  <BrowserRouter>
    <AppRoutesInner />
  </BrowserRouter>
);

export default AppRoutes;
