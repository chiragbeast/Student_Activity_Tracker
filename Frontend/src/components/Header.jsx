import { Bell } from 'lucide-react';
import './Header.css';

export default function Header() {
    return (
        <header className="header">
            <div className="header-left">
                <Bell size={22} className="header-bell" strokeWidth={2} />
                <h1 className="header-title">Notification Center</h1>
            </div>
        </header>
    );
}
