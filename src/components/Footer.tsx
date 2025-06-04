import React from "react";
import { Space, Typography, Button, Tooltip, Progress } from "antd";
import {
  ExportOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { toggleSidebar, showModal } from "../store/slices/uiSlice";

const { Text } = Typography;

const Footer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { sidebarCollapsed } = useSelector((state: RootState) => state.ui);
  const { status } = useSelector((state: RootState) => state.connection);
  const { source, targetFields, pagination } = useSelector((state: RootState) => state.data);
  const { rules } = useSelector((state: RootState) => state.mapping);

  // 计算统计信息
  const totalRecords = pagination?.totalRecords || 0;
  const loadedRecords = source.length;
  const mappingCount = rules.length;
  const validMappings = rules.filter((rule) => rule.validated).length;
  const invalidMappings = mappingCount - validMappings;
  const targetFieldCount = targetFields.length;

  // 计算进度
  const mappingProgress = targetFieldCount > 0 ? (mappingCount / targetFieldCount) * 100 : 0;

  // 处理导出
  const handleExport = () => {
    dispatch(showModal("export"));
  };

  // 切换侧边栏
  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  return (
    <div
      style={{
        padding: "8px 24px",
        background: "#fafafa",
        borderTop: "1px solid #e8e8e8",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 48,
      }}
    >
      {/* 左侧状态信息 */}
      <Space size={24}>
        {/* 连接状态 */}
        <Space size={8}>
          <div
            className={`status-indicator ${
              status === "connected"
                ? "connected"
                : status === "connecting"
                ? "connecting"
                : status === "error"
                ? "error"
                : "idle"
            }`}
          />
          <Text type="secondary">
            {status === "connected" && "已连接"}
            {status === "connecting" && "连接中"}
            {status === "error" && "连接失败"}
            {status === "idle" && "未连接"}
          </Text>
        </Space>

        {/* 数据统计 */}
        {totalRecords > 0 && (
          <Space size={8}>
            <InfoCircleOutlined style={{ color: "#1890ff" }} />
            <Text type="secondary">
              数据: {loadedRecords.toLocaleString()}/{totalRecords.toLocaleString()}
            </Text>
          </Space>
        )}

        {/* 映射统计 */}
        <Space size={8}>
          <CheckCircleOutlined style={{ color: validMappings > 0 ? "#52c41a" : "#d9d9d9" }} />
          <Text type="secondary">
            映射: {mappingCount}/{targetFieldCount}
          </Text>
          {invalidMappings > 0 && (
            <>
              <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
              <Text type="danger">{invalidMappings} 个错误</Text>
            </>
          )}
        </Space>

        {/* 映射进度 */}
        {targetFieldCount > 0 && (
          <div style={{ minWidth: 120 }}>
            <Progress
              percent={Math.round(mappingProgress)}
              size="small"
              status={invalidMappings > 0 ? "exception" : "normal"}
              showInfo={false}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {Math.round(mappingProgress)}% 完成
            </Text>
          </div>
        )}
      </Space>

      {/* 右侧操作按钮 */}
      <Space>
        {/* 侧边栏切换 */}
        <Tooltip title={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}>
          <Button
            type="text"
            size="small"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={handleToggleSidebar}
          />
        </Tooltip>

        {/* 导出按钮 */}
        <Tooltip title="导出映射配置">
          <Button
            type="primary"
            size="small"
            icon={<ExportOutlined />}
            onClick={handleExport}
            disabled={mappingCount === 0}
          >
            导出
          </Button>
        </Tooltip>
      </Space>
    </div>
  );
};

export default Footer;
