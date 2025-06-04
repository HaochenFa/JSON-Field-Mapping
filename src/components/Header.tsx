import React, { useState } from "react";
import { Form, Input, Button, Space, Typography, Tooltip, Radio } from "antd";
import { UpOutlined, DownOutlined } from "@ant-design/icons";
import {
  ApiOutlined,
  ReloadOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  SaveOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { showErrorNotification, showWarningNotification } from "../store/slices/uiSlice";
import {
  updateConfig,
  testConnection,
  connectDatabase,
  clearError,
} from "../store/slices/connectionSlice";
import { fetchSourceData, clearData } from "../store/slices/dataSlice";
import { showModal, showSuccessNotification } from "../store/slices/uiSlice";
import { DatabaseConfig } from "../types";
import { isValidUrl } from "../utils/helpers";

const { Title } = Typography;

const Header: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { config, status, error } = useSelector((state: RootState) => state.connection);
  const { loading } = useSelector((state: RootState) => state.data);

  const [form] = Form.useForm();
  const [testLoading, setTestLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // 处理配置更新
  const handleConfigChange = (field: keyof DatabaseConfig, value: string | number) => {
    dispatch(updateConfig({ [field]: value }));
    if (error) {
      dispatch(clearError());
    }
  };

  // 处理配置类型切换
  const handleConfigTypeChange = (e: any) => {
    const type = e.target.value;
    dispatch(updateConfig({ type }));
    if (error) {
      dispatch(clearError());
    }
  };

  // 测试连接
  const handleTestConnection = async () => {
    // 验证 API 配置
    if (config.type === "api") {
      if (!config.url) {
        dispatch(
          showErrorNotification({
            title: "连接错误",
            message: "请输入API URL",
          })
        );
        return;
      }

      if (!isValidUrl(config.url)) {
        dispatch(
          showErrorNotification({
            title: "连接错误",
            message: "请输入有效的URL格式",
          })
        );
        return;
      }
    }
    // 验证内网数据库配置
    else if (config.type === "database") {
      if (!config.url) {
        dispatch(
          showErrorNotification({
            title: "连接错误",
            message: "请输入数据库地址",
          })
        );
        return;
      }

      if (!config.port) {
        dispatch(
          showErrorNotification({
            title: "连接错误",
            message: "请输入数据库端口",
          })
        );
        return;
      }

      if (!config.database) {
        dispatch(
          showErrorNotification({
            title: "连接错误",
            message: "请输入数据库名称",
          })
        );
        return;
      }

      if (!config.username) {
        dispatch(
          showErrorNotification({
            title: "连接错误",
            message: "请输入用户名",
          })
        );
        return;
      }
    }

    setTestLoading(true);
    try {
      await dispatch(testConnection(config)).unwrap();
      dispatch(
        showSuccessNotification({
          title: "连接测试成功",
          message: config.type === "api" ? "API连接正常" : "数据库连接正常",
        })
      );
    } catch (error: any) {
      dispatch(
        showErrorNotification({
          title: "连接测试失败",
          message: error || (config.type === "api" ? "无法连接到API" : "无法连接到数据库"),
        })
      );
    } finally {
      setTestLoading(false);
    }
  };

  // 连接并获取数据
  const handleConnect = async () => {
    // 验证 API 配置
    if (config.type === "api") {
      if (!config.url || !config.tableName) {
        dispatch(
          showErrorNotification({
            title: "连接错误",
            message: "请填写完整的API连接信息",
          })
        );
        return;
      }

      if (!isValidUrl(config.url)) {
        dispatch(
          showErrorNotification({
            title: "连接错误",
            message: "请输入有效的URL格式",
          })
        );
        return;
      }
    }
    // 验证内网数据库配置
    else if (config.type === "database") {
      if (
        !config.url ||
        !config.port ||
        !config.database ||
        !config.username ||
        !config.tableName
      ) {
        dispatch(
          showErrorNotification({
            title: "连接错误",
            message: "请填写完整的数据库连接信息",
          })
        );
        return;
      }
    }

    try {
      // 先连接数据库
      await dispatch(connectDatabase(config)).unwrap();

      // 然后获取数据
      await dispatch(fetchSourceData({ page: 1, pageSize: 100 })).unwrap();

      dispatch(
        showSuccessNotification({
          title: "连接成功",
          message: "数据获取完成",
        })
      );
    } catch (error: any) {
      dispatch(
        showErrorNotification({
          title: "连接失败",
          message: error || "连接或数据获取失败",
        })
      );
    }
  };

  // 重新获取数据
  const handleRefresh = async () => {
    if (status !== "connected") {
      dispatch(
        showWarningNotification({
          title: "警告",
          message: "请先连接数据库",
        })
      );
      return;
    }

    try {
      await dispatch(fetchSourceData({ page: 1, pageSize: 100 })).unwrap();
      dispatch(
        showSuccessNotification({
          title: "刷新成功",
          message: "数据已更新",
        })
      );
    } catch (error: any) {
      dispatch(
        showErrorNotification({
          title: "刷新失败",
          message: error || "数据获取失败",
        })
      );
    }
  };

  // 清除数据
  const handleClear = () => {
    dispatch(clearData());
    dispatch(
      showSuccessNotification({
        title: "清除成功",
        message: "数据已清除",
      })
    );
  };

  // 保存配置
  const handleSaveConfig = () => {
    dispatch(showModal("configSave"));
  };

  // 加载配置
  const handleLoadConfig = () => {
    dispatch(showModal("configLoad"));
  };

  // 显示帮助
  const handleShowHelp = () => {
    dispatch(showModal("help"));
  };

  const isConnecting = status === "connecting" || loading;
  const isConnected = status === "connected";

  return (
    <div style={{ padding: "16px 24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
            JSON字段映射工具
          </Title>
          <Button
            type="link"
            icon={collapsed ? <DownOutlined /> : <UpOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ marginLeft: 8 }}
          >
            {collapsed ? "展开" : "收起"}
          </Button>
        </div>

        <Space>
          <Tooltip title="保存配置">
            <Button icon={<SaveOutlined />} onClick={handleSaveConfig} disabled={!config.url}>
              保存
            </Button>
          </Tooltip>

          <Tooltip title="加载配置">
            <Button icon={<FolderOpenOutlined />} onClick={handleLoadConfig}>
              加载
            </Button>
          </Tooltip>

          <Tooltip title="帮助">
            <Button icon={<QuestionCircleOutlined />} onClick={handleShowHelp} />
          </Tooltip>
        </Space>
      </div>

      {!collapsed && (
        <Form
          form={form}
          layout="inline"
          style={{ width: "100%", flexWrap: "wrap", display: "flex", alignItems: "flex-start" }}
          initialValues={config}
        >
          <Form.Item label="配置类型" style={{ width: "100%", margin: "0 0 16px 0" }}>
            <Radio.Group
              value={config.type}
              onChange={handleConfigTypeChange}
              disabled={isConnecting}
            >
              <Radio.Button value="api">API 配置</Radio.Button>
              <Radio.Button value="database">内网数据库</Radio.Button>
            </Radio.Group>
          </Form.Item>
          {config.type === "api" ? (
            <>
              <Form.Item
                label="API URL"
                style={{ flex: "1 1 250px", margin: "0 8px 8px 0", minWidth: "280px" }}
                labelCol={{ style: { minWidth: "80px", marginRight: "8px" } }}
                validateStatus={error ? "error" : ""}
                help={error && "连接失败"}
              >
                <Input
                  placeholder="https://api.example.com/v1"
                  value={config.url}
                  onChange={(e) => handleConfigChange("url", e.target.value)}
                  prefix={<ApiOutlined />}
                  disabled={isConnecting}
                />
              </Form.Item>

              <Form.Item
                label="API密钥"
                style={{ flex: "1 1 180px", margin: "0 8px 8px 0", minWidth: "220px" }}
                labelCol={{ style: { minWidth: "80px", marginRight: "8px" } }}
              >
                <Input.Password
                  placeholder="请输入API密钥"
                  value={config.apiKey}
                  onChange={(e) => handleConfigChange("apiKey", e.target.value)}
                  disabled={isConnecting}
                />
              </Form.Item>

              <Form.Item
                label="表名"
                style={{ flex: "0 1 150px", margin: "0 8px 16px 0", minWidth: "180px" }}
                labelCol={{ style: { minWidth: "60px", marginRight: "8px" } }}
              >
                <Input
                  placeholder="table_name"
                  value={config.tableName || undefined}
                  onChange={(e) => handleConfigChange("tableName", e.target.value)}
                  disabled={isConnecting}
                />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                label="数据库URL"
                style={{ flex: "1 1 250px", margin: "0 8px 16px 0", minWidth: "280px" }}
                labelCol={{ style: { minWidth: "80px", marginRight: "8px" } }}
                validateStatus={error ? "error" : ""}
                help={error && "连接失败"}
              >
                <Input
                  placeholder="localhost"
                  value={config.url}
                  onChange={(e) => handleConfigChange("url", e.target.value)}
                  prefix={<ApiOutlined />}
                  disabled={isConnecting}
                />
              </Form.Item>

              <Form.Item
                label="端口"
                style={{ flex: "0 1 100px", margin: "0 8px 16px 0", minWidth: "150px" }}
                labelCol={{ style: { minWidth: "60px", marginRight: "8px" } }}
              >
                <Input
                  placeholder="3306"
                  value={config.port ? config.port.toString() : undefined}
                  onChange={(e) => {
                    const value = e.target.value;
                    const port = value ? parseInt(value, 10) : undefined;
                    dispatch(updateConfig({ port }));
                  }}
                  disabled={isConnecting}
                />
              </Form.Item>

              <Form.Item
                label="数据库名"
                style={{ flex: "0 1 150px", margin: "0 8px 16px 0", minWidth: "180px" }}
                labelCol={{ style: { minWidth: "80px", marginRight: "8px" } }}
              >
                <Input
                  placeholder="mydatabase"
                  value={config.database || undefined}
                  onChange={(e) => handleConfigChange("database", e.target.value)}
                  disabled={isConnecting}
                />
              </Form.Item>

              <Form.Item
                label="用户名"
                style={{ flex: "0 1 150px", margin: "0 8px 16px 0", minWidth: "180px" }}
                labelCol={{ style: { minWidth: "70px", marginRight: "8px" } }}
              >
                <Input
                  placeholder="root"
                  value={config.username || undefined}
                  onChange={(e) => handleConfigChange("username", e.target.value)}
                  disabled={isConnecting}
                />
              </Form.Item>

              <Form.Item
                label="密码"
                style={{ flex: "0 1 150px", margin: "0 8px 16px 0", minWidth: "180px" }}
                labelCol={{ style: { minWidth: "60px", marginRight: "8px" } }}
              >
                <Input.Password
                  placeholder="请输入密码"
                  value={config.password || undefined}
                  onChange={(e) => handleConfigChange("password", e.target.value)}
                  disabled={isConnecting}
                />
              </Form.Item>

              <Form.Item
                label="表名"
                style={{ flex: "0 1 150px", margin: "0 8px 16px 0", minWidth: "180px" }}
                labelCol={{ style: { minWidth: "60px", marginRight: "8px" } }}
              >
                <Input
                  placeholder="table_name"
                  value={config.tableName || undefined}
                  onChange={(e) => handleConfigChange("tableName", e.target.value)}
                  disabled={isConnecting}
                />
              </Form.Item>
            </>
          )}
        </Form>
      )}

      {/* 操作按钮和状态指示 - 单独一行，状态在左侧，按钮在右侧 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          marginTop: collapsed ? "8px" : "16px",
        }}
      >
        {/* 连接状态指示 - 左侧 */}
        <div style={{ fontSize: 12, color: "#8c8c8c", display: "flex", alignItems: "center" }}>
          状态:
          <span
            className={`status-indicator ${
              status === "connected"
                ? "connected"
                : status === "connecting"
                ? "connecting"
                : status === "error"
                ? "error"
                : "idle"
            }`}
            style={{ marginLeft: 4, marginRight: 4 }}
          />
          {status === "connected" && "已连接"}
          {status === "connecting" && "连接中..."}
          {status === "error" && "连接失败"}
          {status === "idle" && "未连接"}
          {error && ` - ${error}`}
        </div>

        {/* 操作按钮 - 右侧 */}
        <Space wrap>
          <Tooltip title="测试连接">
            <Button
              icon={<SettingOutlined />}
              onClick={handleTestConnection}
              loading={testLoading}
              disabled={
                isConnecting ||
                (config.type === "api"
                  ? !config.url
                  : !config.url || !config.port || !config.database || !config.username)
              }
            >
              测试
            </Button>
          </Tooltip>

          <Button
            type="primary"
            icon={<ApiOutlined />}
            onClick={handleConnect}
            loading={isConnecting}
            disabled={
              config.type === "api"
                ? !config.url || !config.tableName
                : !config.url ||
                  !config.port ||
                  !config.database ||
                  !config.username ||
                  !config.tableName
            }
          >
            {isConnected ? "重新连接" : "连接"}
          </Button>

          <Tooltip title="刷新数据">
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              disabled={!isConnected || loading}
              loading={loading}
            >
              刷新
            </Button>
          </Tooltip>

          <Button onClick={handleClear} disabled={isConnecting}>
            清除
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default Header;
