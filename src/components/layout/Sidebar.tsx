// src/components/layout/Sidebar.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen((prev) => !prev);

  return (
    <>
      {/* ハンバーガーボタン */}
      <button
        onClick={toggleSidebar}
        className="hamburger-btn"
        aria-label="メニュー開閉"
      >
        <svg
          className="hamburger-icon"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* オーバーレイ */}
      {isOpen && <div className="overlay" onClick={toggleSidebar} aria-hidden="true" />}

      {/* サイドバー */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <h1 className='sidebar-title'>電子カルテ</h1>
        <nav>
          <ul>
            <li>
              <Link to="/patients" onClick={toggleSidebar}>
                患者一覧
              </Link>
            </li>
            <li>
              <Link to="/anatomy" onClick={toggleSidebar}>
                解剖学ページ
              </Link>
            </li>
            <li>
              <Link to="/physiology" onClick={toggleSidebar}>
                生理学ページ
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
