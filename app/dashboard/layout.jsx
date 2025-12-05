import React from "react";
import SiderBar from "./_components/SiderBar";
import Header from "./_components/Header";
function DashboardLayout({ children }) {
  return (
    <div>
      <div className="md:w-64 h-screen fixed">
        <SiderBar />
      </div>
      <div className="md:ml-64">
        <Header></Header>
        <div className="p-10">{children}</div>
      </div>
    </div>
  );
}

export default DashboardLayout;
