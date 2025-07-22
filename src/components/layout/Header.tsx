// src/components/layout/Header.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  return (
    <header className="header">
      <button className="menu-button" onClick={toggleSidebar} aria-label="メニューを開く">
        <FontAwesomeIcon icon={faBars} />
      </button>
      <h1 className="app-title">電子カルテ</h1>
    </header>
  );
};

export default Header;
