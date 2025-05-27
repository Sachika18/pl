import React, { useState } from 'react';

const MobileMenu = ({ toggleSidebar }) => {
  return (
    <button className="mobile-menu-toggle" onClick={toggleSidebar}>
      ☰
    </button>
  );
};

export default MobileMenu;