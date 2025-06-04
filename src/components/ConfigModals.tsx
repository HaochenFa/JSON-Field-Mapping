import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  List,
  Typography,
  Space,
  Popconfirm,
  Empty,
  Radio,
} from "antd";
import { SaveOutlined, DeleteOutlined, LoadingOutlined } from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { hideModal, showSuccessNotification, showErrorNotification } from "../store/slices/uiSlice";
import { updateConfig } from "../store/slices/connectionSlice";
import { setTargetFields } from "../store/slices/dataSlice";
import { MappingConfig } from "../types";
import { saveConfigToStorage, loadConfigFromStorage } from "../utils/storage";
import { generateId } from "../utils/helpers";

const { Text } = Typography;
const { TextArea } = Input;

// 本地存储键
const STORAGE_KEY = "json_field_mapping_configs";

// 配置保存模态框
export const ConfigSaveModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isVisible = useSelector((state: RootState) => state.ui.modals.configSave);
  const connectionConfig = useSelector((state: RootState) => state.connection.config);
  const targetFields = useSelector((state: RootState) => state.data.targetFields);
  const mappingRules = useSelector((state: RootState) => state.mapping.rules);

  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // 处理取消
  const handleCancel = () => {
    dispatch(hideModal("configSave"));
    form.resetFields();
  };

  // 处理保存
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      // 创建配置对象
      const config: MappingConfig = {
        id: generateId(),
        name: values.name,
        description: values.description,
        sourceConfig: connectionConfig,
        targetFields: targetFields,
        mappings: mappingRules,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 获取现有配置
      const existingConfigs: MappingConfig[] = loadConfigFromStorage(STORAGE_KEY) || [];

      // 添加新配置
      const updatedConfigs = [...existingConfigs, config];

      // 保存到本地存储
      saveConfigToStorage(STORAGE_KEY, updatedConfigs);

      // 显示成功通知
      dispatch(
        showSuccessNotification({
          title: "保存成功",
          message: `配置 "${values.name}" 已保存`,
        })
      );

      // 关闭模态框并重置表单
      dispatch(hideModal("configSave"));
      form.resetFields();
    } catch (error) {
      console.error("保存配置失败:", error);
      dispatch(
        showErrorNotification({
          title: "保存失败",
          message: "保存配置时发生错误",
        })
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="保存配置"
      open={isVisible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={saving ? <LoadingOutlined /> : <SaveOutlined />}
          loading={saving}
          onClick={handleSave}
        >
          保存
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" initialValues={{ name: "", description: "" }}>
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            当前保存的配置类型:{" "}
            <Text strong>{connectionConfig.type === "api" ? "API 配置" : "内网数据库配置"}</Text>
          </Text>
        </div>

        <Form.Item
          name="name"
          label="配置名称"
          rules={[{ required: true, message: "请输入配置名称" }]}
        >
          <Input placeholder="例如: 用户数据映射" />
        </Form.Item>

        <Form.Item name="description" label="配置描述">
          <TextArea placeholder="配置的用途和说明" rows={4} maxLength={200} showCount />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// 配置加载模态框
export const ConfigLoadModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isVisible = useSelector((state: RootState) => state.ui.modals.configLoad);

  const [configs, setConfigs] = useState<MappingConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const currentConfigType = useSelector((state: RootState) => state.connection.config.type);
  const [configType, setConfigType] = useState<"api" | "database">(currentConfigType);

  // 加载配置列表
  useEffect(() => {
    if (isVisible) {
      const savedConfigs = loadConfigFromStorage<MappingConfig[]>(STORAGE_KEY) || [];
      setConfigs(savedConfigs);
    }
  }, [isVisible]);

  // 处理取消
  const handleCancel = () => {
    dispatch(hideModal("configLoad"));
  };

  // 处理加载配置
  const handleLoadConfig = async (config: MappingConfig) => {
    try {
      setLoading(true);

      // 更新连接配置
      dispatch(updateConfig(config.sourceConfig));

      // 更新目标字段
      dispatch(setTargetFields(config.targetFields));

      // 更新映射规则
      // 注意：需要在 mappingSlice.ts 中添加 setMappingRules action
      // 这里假设已经添加了该 action
      dispatch({ type: "mapping/setMappingRules", payload: config.mappings });

      // 显示成功通知
      dispatch(
        showSuccessNotification({
          title: "加载成功",
          message: `配置 "${config.name}" 已加载`,
        })
      );

      // 关闭模态框
      dispatch(hideModal("configLoad"));
    } catch (error) {
      console.error("加载配置失败:", error);
      dispatch(
        showErrorNotification({
          title: "加载失败",
          message: "加载配置时发生错误",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  // 处理删除配置
  const handleDeleteConfig = (configId: string) => {
    // 过滤掉要删除的配置
    const updatedConfigs = configs.filter((config) => config.id !== configId);

    // 更新本地存储
    saveConfigToStorage(STORAGE_KEY, updatedConfigs);

    // 更新状态
    setConfigs(updatedConfigs);

    // 显示成功通知
    dispatch(
      showSuccessNotification({
        title: "删除成功",
        message: "配置已删除",
      })
    );
  };

  // 过滤配置列表
  const filteredConfigs = configs.filter((config) => config.sourceConfig.type === configType);

  return (
    <Modal
      title="加载配置"
      open={isVisible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          关闭
        </Button>,
      ]}
      width={600}
    >
      <div style={{ marginBottom: 16 }}>
        <Radio.Group
          value={configType}
          onChange={(e) => setConfigType(e.target.value)}
          optionType="button"
          buttonStyle="solid"
        >
          <Radio.Button value="api">API 配置</Radio.Button>
          <Radio.Button value="database">内网数据库</Radio.Button>
        </Radio.Group>
      </div>

      {filteredConfigs.length === 0 ? (
        <Empty description={configs.length === 0 ? "暂无保存的配置" : "没有符合条件的配置"} />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={filteredConfigs}
          renderItem={(config) => (
            <List.Item
              key={config.id}
              actions={[
                <Button
                  key="load"
                  type="primary"
                  size="small"
                  onClick={() => handleLoadConfig(config)}
                  loading={loading}
                >
                  加载
                </Button>,
                <Popconfirm
                  key="delete"
                  title="确认删除"
                  description="确定要删除这个配置吗？此操作不可恢复。"
                  onConfirm={() => handleDeleteConfig(config.id)}
                  okText="删除"
                  cancelText="取消"
                  okType="danger"
                >
                  <Button key="delete" type="text" danger size="small" icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{config.name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      [{config.sourceConfig.type === "api" ? "API" : "内网数据库"}]
                    </Text>
                  </Space>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary">{config.description || "无描述"}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      创建时间: {new Date(config.createdAt).toLocaleString()}
                    </Text>
                    {config.sourceConfig.type === "api" ? (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        API URL: {config.sourceConfig.url}
                      </Text>
                    ) : (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        数据库: {config.sourceConfig.database || "未指定"} @{" "}
                        {config.sourceConfig.url}
                      </Text>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
};

// 导出组合组件
const ConfigModals: React.FC = () => {
  return (
    <>
      <ConfigSaveModal />
      <ConfigLoadModal />
    </>
  );
};

export default ConfigModals;
