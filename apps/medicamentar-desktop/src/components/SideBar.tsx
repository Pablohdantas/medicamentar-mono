import React from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import Timer_Icon from '../../public/assets/icons/Timer_Icon';
import Stethoscope_Icon from '../../public/assets/icons/Stethoscope_Icon';
import Pill_Icon from '../../public/assets/icons/Pill_Icon';
import Profile_Icon from '../../public/assets/icons/Profile_Icon';
import Config_Icon from '../../public/assets/icons/Config_Icon';
import Logout_Icon from '../../public/assets/icons/Logout_Icon';
import { useAuth } from '../hooks/useAuth';

const items = [
    { text: 'EVENTOS PRÓXIMOS', icon: <Timer_Icon /> },
    { text: 'CONSULTAS E EXAMES', icon: <Stethoscope_Icon /> },
    { text: 'MEDICAMENTOS', icon: <Pill_Icon /> },
    { text: 'PERFIL', icon: <Profile_Icon /> },
    { text: 'CONFIGURAÇÕES', icon: <Config_Icon /> },
    { text: 'SAIR', icon: <Logout_Icon />, action: 'logout' },
];

const drawerStyles = {
    flexShrink: 0,
    width: 300,
    '& .MuiDrawer-paper': {
        width: 300,
        boxSizing: 'border-box',
        borderRight: 'none', 
        backgroundColor: "#F4FAFE",
        paddingTop: '128px',
        zIndex: 1200,
    },
};

const listItemStyles = {
    display: 'flex',
    alignItems: 'center',
    '&:hover': { backgroundColor: 'rgba(212, 237, 255, 1)' },
};

const listItemIconStyles = {
    display: 'flex',
    justifyContent: 'center',
};

const Sidebar: React.FC = () => {
    const { logout } = useAuth();

    const handleItemClick = async (action: string | undefined) => {
        if (action === 'logout') {
            window.electron.store.delete("email");
            window.electron.store.delete("password");
            await logout();
        }
    };

    return (
        <Drawer variant="permanent" anchor="left" sx={drawerStyles}>
            <List>
                {items.map(({ text, icon, action }) => (
                    <ListItemButton
                        key={text}
                        sx={listItemStyles}
                        onClick={() => handleItemClick(action)}
                    >
                        <ListItemIcon sx={listItemIconStyles}>
                            {icon}
                        </ListItemIcon>
                        <ListItemText
                            primary={text}
                            primaryTypographyProps={{ sx: { fontSize: '14px', fontWeight: '500'} }}
                            sx={{ flex: 1, marginLeft: '12px',}}
                        />
                    </ListItemButton>
                ))}
            </List>
        </Drawer>
    );
};

export default Sidebar;
