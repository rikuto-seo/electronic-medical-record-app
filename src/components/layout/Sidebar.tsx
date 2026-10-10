import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faList,
  faUserPlus,
  faCalendarAlt,
  faBrain,
  faHeartbeat,
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
            <NavLink end to="/patients" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faList} style={{ marginRight: '0.5em' }} />
              患者一覧
            </NavLink>
          </li>
          <li>
            <NavLink to="/patients/new" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: '0.5em' }} />
              新規患者
            </NavLink>
          </li>
          <li>
            <NavLink to="/reservations" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '0.5em' }} />
              予約管理
            </NavLink>
          </li>
          <li>
            <NavLink to="/anatomy" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faBrain} style={{ marginRight: '0.5em' }} />
              解剖学
            </NavLink>
          </li>
          <li>
            <NavLink to="/physiology" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faHeartbeat} style={{ marginRight: '0.5em' }} />
              生理学
            </NavLink>
          </li>
          <li>
            <NavLink to="/pathology" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faMicroscope} style={{ marginRight: '0.5em' }} />
              病理学
            </NavLink>
          </li>
          <li>
            <NavLink to="/oriental-medicine" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faLeaf} style={{ marginRight: '0.5em' }} />
              東洋医学
            </NavLink>
          </li>
          <li>
            <NavLink to="/clinical-medicine" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faStethoscope} style={{ marginRight: '0.5em' }} />
              臨床医学
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
