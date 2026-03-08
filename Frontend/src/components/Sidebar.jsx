import { useState } from 'react';
import { LayoutGrid, Users, FileClock } from 'lucide-react';
import './Sidebar.css';

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'students', label: 'Assigned Students', icon: Users },
    { id: 'pending', label: 'Pending Submission', icon: FileClock },
];

function getInitials(name) {
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

export default function Sidebar() {
    const [active, setActive] = useState('students');

    return (
        <aside className="sidebar">
            <div className="sidebar-top">
                <div className="sidebar-brand">
                    <span className="brand-icon">⊞</span>
                    <span className="brand-name">SAPT system</span>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            className={`sidebar-nav-item ${active === id ? 'active' : ''}`}
                            onClick={() => setActive(id)}
                        >
                            <Icon size={18} strokeWidth={1.8} />
                            <span>{label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="sidebar-footer">
                <div className="profile-initials-avatar">
                    {getInitials('Administrator')}
                </div>
                <div className="profile-info">
                    <span className="profile-name">Administrator</span>
                    <span className="profile-role">View Profile</span>
                </div>
            </div>
        </aside>
    );
}
