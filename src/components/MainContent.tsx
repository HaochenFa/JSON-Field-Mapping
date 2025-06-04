import React, { useEffect } from "react";
import { Layout, Spin } from "antd";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import MappingArea from "./MappingArea";

const { Sider, Content } = Layout;

const MainContent: React.FC = () => {
  const { sidebarCollapsed } = useSelector((state: RootState) => state.ui);
  useSelector((state: RootState) => state.connection);
  const { loading } = useSelector((state: RootState) => state.data);
  const [, setSiderWidth] = React.useState(400);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 1600 && width >= 1400) {
        setSiderWidth(350);
      } else if (width < 1400 && width >= 1200) {
        setSiderWidth(300);
      } else if (width < 1200) {
        setSiderWidth(280);
      } else {
        setSiderWidth(400);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Layout style={{ height: "100%", background: "#f5f5f5" }}>
      {/* 左侧面板 - 数据源 */}
      <Sider
        width={sidebarCollapsed ? 0 : "30%"}
        collapsible
        collapsed={sidebarCollapsed}
        collapsedWidth={0}
        style={{
          background: "#fff",
          borderRight: "1px solid #e8e8e8",
          overflow: "auto",
        }}
        trigger={null}
        theme="light"
        className="left-panel"
      >
        <LeftPanel />
      </Sider>

      {/* 中间映射区域 */}
      <Content
        style={{
          flex: 1,
          background: "#fff",
          margin: "0 8px",
          borderRadius: 6,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {loading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(255, 255, 255, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <Spin size="large" tip="加载中..." />
          </div>
        )}

        <MappingArea />
      </Content>

      {/* 右侧面板 - 目标字段 */}
      <Sider
        width={sidebarCollapsed ? 0 : "30%"}
        collapsible
        collapsed={sidebarCollapsed}
        collapsedWidth={0}
        theme="light"
        className="right-panel"
        style={{
          background: "#fff",
          borderLeft: "1px solid #e8e8e8",
          overflow: "auto",
        }}
        trigger={null}
      >
        <RightPanel />
      </Sider>
    </Layout>
  );
};

export default MainContent;
