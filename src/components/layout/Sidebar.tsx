import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faList,
  faUserPlus,
  faCalendarAlt,
  faBrain,
  faHeartbeat,
  faCalendarDays,
  faMicroscope,
  faLeaf,
  faStethoscope
} from '@fortawesome/free-solid-svg-icons';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <h1 className='sidebar-title'>電子カルテ</h1>
      <nav>
        <ul>
          <li>
            <Link to="/patients" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faList} style={{ marginRight: '0.5em' }} />
              患者一覧
            </Link>
          </li>
          <li>
            <Link to="/patients/new" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: '0.5em' }} />
              新規患者
            </Link>
          </li>
          <li>
            <Link to="/reservations" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '0.5em' }} />
              予約管理
            </Link>
          </li>
          <li>
            <Link to="/calendar" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faCalendarDays} style={{ marginRight: '0.5em' }} />
              カレンダー
            </Link>
          </li>
          <li>
            <Link to="/anatomy" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faBrain} style={{ marginRight: '0.5em' }} />
              解剖学
            </Link>
          </li>
          <li>
            <Link to="/physiology" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faHeartbeat} style={{ marginRight: '0.5em' }} />
              生理学
            </Link>
          </li>
          <li>
            <Link to="/pathology" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faMicroscope} style={{ marginRight: '0.5em' }} />
              病理学
            </Link>
          </li>
          <li>
            <Link to="/oriental-medicine" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faLeaf} style={{ marginRight: '0.5em' }} />
              東洋医学
            </Link>
          </li>
          <li>
            <Link to="/clinical-medicine" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faStethoscope} style={{ marginRight: '0.5em' }} />
              臨床医学
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
