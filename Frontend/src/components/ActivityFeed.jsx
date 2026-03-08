import { useState, useMemo } from 'react';
import { CheckCircle2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import NotificationCard from './NotificationCard';
import './ActivityFeed.css';

// Helper to generate mock data
const generateNotifications = (count) => {
    const baseNotifications = [
        { title: 'Q3 Strategy Review Presentation', sender: 'Sarah Jenkins', avatarSeed: 10, description: 'Sarah Jenkins has shared the Q3 Strategy Review Presentation slides.' },
        { title: 'Database Migration Success', sender: 'Marcus Thorne', avatarSeed: 12, description: 'The production database migration to the new cluster was completed successfully.' },
        { title: 'Budget Approval: Project Apollo', sender: 'Elena Rodriguez', avatarSeed: 7, description: 'The Q4 budget request for Project Apollo has been approved.' },
        { title: 'Design System V2 Update', sender: 'David Chen', avatarSeed: 15, description: 'Design System V2 has been published on Figma.' },
        { title: 'Weekly Team Sync Minutes', sender: 'Chloe Watson', avatarSeed: 20, description: 'Minutes from the weekly team sync are now available.' },
        { title: 'Security Patch Deployed', sender: 'System Admin', avatarSeed: 3, description: 'A critical security patch has been applied to all production servers.' },
    ];

    return Array.from({ length: count }, (_, i) => {
        const base = baseNotifications[i % baseNotifications.length];
        return {
            ...base,
            id: i + 1,
            timestamp: `Oct ${24 - Math.floor(i / 10)}, ${10 - (i % 10)}:${(i % 5) * 10} AM`,
        };
    });
};

const PAGE_SIZE = 10;
const TOTAL_PAGES = 100;
const ALL_NOTIFICATIONS = generateNotifications(PAGE_SIZE * TOTAL_PAGES);

export default function ActivityFeed() {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const filtered = useMemo(() => {
        let result = ALL_NOTIFICATIONS;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = ALL_NOTIFICATIONS.filter(
                (n) =>
                    n.title.toLowerCase().includes(q) ||
                    n.sender.toLowerCase().includes(q)
            );
        }
        return result;
    }, [searchQuery]);

    const totalPagesForFiltered = Math.ceil(filtered.length / PAGE_SIZE) || 1;
    const safeCurrentPage = Math.min(currentPage, totalPagesForFiltered);

    const paginatedData = useMemo(() => {
        const start = (safeCurrentPage - 1) * PAGE_SIZE;
        return filtered.slice(start, start + PAGE_SIZE);
    }, [filtered, safeCurrentPage]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPagesForFiltered) {
            setCurrentPage(newPage);
            // Scroll to top of list on page change
            const scrollable = document.querySelector('.feed-scrollable');
            if (scrollable) scrollable.scrollTop = 0;
        }
    };

    // Generate page numbers to show (e.g., 1, 2, 3, 4 ... 100)
    const renderPagination = () => {
        const pages = [];
        const maxVisible = 5;

        let start = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPagesForFiltered, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(
                <button
                    key={i}
                    className={`page-number ${safeCurrentPage === i ? 'active' : ''}`}
                    onClick={() => handlePageChange(i)}
                >
                    {i}
                </button>
            );
        }

        return (
            <div className="pagination">
                <button
                    className="page-btn"
                    disabled={safeCurrentPage === 1}
                    onClick={() => handlePageChange(safeCurrentPage - 1)}
                >
                    <ChevronLeft size={16} />
                </button>

                {start > 1 && (
                    <>
                        <button className="page-number" onClick={() => handlePageChange(1)}>1</button>
                        {start > 2 && <span className="pagination-ellipsis">...</span>}
                    </>
                )}

                {pages}

                {end < totalPagesForFiltered && (
                    <>
                        {end < totalPagesForFiltered - 1 && <span className="pagination-ellipsis">...</span>}
                        <button className="page-number" onClick={() => handlePageChange(totalPagesForFiltered)}>{totalPagesForFiltered}</button>
                    </>
                )}

                <button
                    className="page-btn"
                    disabled={safeCurrentPage === totalPagesForFiltered}
                    onClick={() => handlePageChange(safeCurrentPage + 1)}
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        );
    };

    return (
        <main className="feed-container">
            <div className="feed-header">
                <div className="feed-header-top">
                    <h2 className="feed-title">Activity Feed</h2>
                    <p className="feed-subtitle">
                        Stay updated with your latest project movements and system alerts.
                    </p>
                </div>

                <div className="feed-search">
                    <Search size={15} className="feed-search-icon" strokeWidth={2} />
                    <input
                        type="text"
                        placeholder="Search notifications..."
                        className="feed-search-input"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1); // Reset to first page on search
                        }}
                    />
                </div>
            </div>

            <div className="feed-scrollable">
                <div className="feed-list height-adjusted">
                    {paginatedData.length > 0 ? (
                        paginatedData.map((notification) => (
                            <NotificationCard key={notification.id} notification={notification} />
                        ))
                    ) : (
                        <div className="feed-empty">No notifications found.</div>
                    )}
                </div>

                {totalPagesForFiltered > 1 && renderPagination()}

                <div className="feed-end">
                    <CheckCircle2 size={28} className="feed-end-icon" strokeWidth={1.5} />
                    <p className="feed-end-text">You've reached the end of current page</p>
                </div>
            </div>
        </main>
    );
}
