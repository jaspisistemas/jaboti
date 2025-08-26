import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, AppBar, Typography, ListItemButton, IconButton, Menu, MenuItem, Avatar, Tooltip, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ChatIcon from '@mui/icons-material/Chat';
import LinkIcon from '@mui/icons-material/Link';
import LanIcon from '@mui/icons-material/Lan';
import ContactsIcon from '@mui/icons-material/Contacts';
import { logout } from '../redux/slices/authSlice';
import type { RootState } from '../redux/store';

const drawerWidth = 220;
const collapsedWidth = 68;

const menuItems = [
  { text: 'Painel', icon: <DashboardIcon />, path: '/painel' },
  { text: 'Chat', icon: <ChatIcon />, path: '/chat' },
  { text: 'CodeChat', icon: <LanIcon />, path: '/codechat' },
  { text: 'Departamentos', icon: <GroupIcon />, path: '/departamentos' },
  { text: 'Atendentes', icon: <AccountCircle />, path: '/atendentes' },
  { text: 'Vínculos Dep x Atend', icon: <LinkIcon />, path: '/vinculos-departamentos' },
  { text: 'Contatos', icon: <ContactsIcon />, path: '/contatos' },
];

// Componente do dropdown do usuário logado
const UserDropdown: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleProfile = () => {
    handleClose();
    navigate('/perfil');
  };
  const handleLogout = () => {
    dispatch(logout());
    handleClose();
  navigate('/login');
  };

  if (!user) return null;

  return (
    <>
      <IconButton onClick={handleMenu} color="inherit" size="large" sx={{ ml: 2 }}>
        <Avatar sx={{ bgcolor: '#1976d2', width: 32, height: 32, fontSize: 18 }}>
          {user.name ? user.name[0].toUpperCase() : <AccountCircle />}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleProfile}>Perfil</MenuItem>
        <MenuItem onClick={handleLogout}>Sair</MenuItem>
      </Menu>
    </>
  );
};

const AdminLayout: React.FC = () => {
  const [open, setOpen] = useState(true);

  const toggleDrawer = () => setOpen(o => !o);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <AppBar
        position="fixed"
        color="primary"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 2,
          transition: (theme) => theme.transitions.create(['width','margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ml: open ? `${drawerWidth}px` : `${collapsedWidth}px`,
          width: open ? `calc(100% - ${drawerWidth}px)` : `calc(100% - ${collapsedWidth}px)`,
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton color="inherit" onClick={toggleDrawer} edge="start" size="large">
              <span style={{ width: 22, height: 2, background: 'currentColor', display: 'block', position: 'relative' }}>
                <span style={{ position: 'absolute', top: -6, left: 0, width: 22, height: 2, background: 'currentColor' }} />
                <span style={{ position: 'absolute', top: 6, left: 0, width: 22, height: 2, background: 'currentColor' }} />
              </span>
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
              Painel Jaboti
            </Typography>
          </Box>
          <UserDropdown />
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : collapsedWidth,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
          [`& .MuiDrawer-paper`]: {
            width: open ? drawerWidth : collapsedWidth,
            overflowX: 'hidden',
            boxSizing: 'border-box',
            transition: (theme) => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
            borderRight: '1px solid rgba(0,0,0,0.12)'
          },
        }}
      >
        <Toolbar sx={{ minHeight: 64 }} />
        <Divider />
        <List sx={{ p: 1 }}>
          {menuItems.map(item => (
            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
              <Tooltip title={!open ? item.text : ''} placement="right" arrow>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  sx={{
                    minHeight: 46,
                    px: 1.2,
                    borderRadius: 1.5,
                    mb: 0.5,
                    justifyContent: open ? 'initial' : 'center',
                    '& .MuiListItemIcon-root': {
                      minWidth: 0,
                      mr: open ? 1.5 : 'auto',
                      justifyContent: 'center',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'primary.main' }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                    sx={{ opacity: open ? 1 : 0, transition: 'opacity .25s' }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          bgcolor: 'background.default',
          transition: (theme) => theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;
