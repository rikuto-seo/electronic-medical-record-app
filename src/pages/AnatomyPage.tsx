import React from 'react';
import AnatomyViewer from '../components/anatomy/AnatomyViewer';

const AnatomyPage: React.FC = () => {
  return (
    <div>
      <h1>3D解剖</h1>
      <AnatomyViewer />
    </div>
  );
};

export default AnatomyPage;
