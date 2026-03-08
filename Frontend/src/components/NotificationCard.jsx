import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './NotificationCard.css';

// Generate a consistent hue from a name string
function nameToHue(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
}

function getInitials(name) {
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

export default function NotificationCard({ notification }) {
    const { title, sender, timestamp, description } = notification;
    const [expanded, setExpanded] = useState(false);

    const hue = nameToHue(sender);
    const bgColor = `hsl(${hue}, 55%, 42%)`;
    const initials = getInitials(sender);

    return (
        <div className={`notification-card ${expanded ? 'expanded' : ''}`}>
            <div className="card-main" onClick={() => setExpanded((v) => !v)}>
                <div className="card-avatar">
                    <div className="card-avatar-initials" style={{ background: bgColor }}>
                        {initials}
                    </div>
                </div>

                <div className="card-body">
                    <span className="card-title">{title}</span>
                    <span className="card-sender">Sent by {sender}</span>
                </div>

                <div className="card-meta">
                    <span className="card-timestamp">{timestamp}</span>
                    <button
                        className={`collapse-btn ${expanded ? 'open' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
                        aria-label={expanded ? 'Collapse message' : 'Expand message'}
                        title={expanded ? 'Hide description' : 'Show description'}
                    >
                        {expanded ? <ChevronUp size={16} strokeWidth={2} /> : <ChevronDown size={16} strokeWidth={2} />}
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="card-description">
                    <p>{description || 'No additional details available for this notification.'}</p>
                </div>
            )}
        </div>
    );
}
