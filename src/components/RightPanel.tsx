import React, { useState } from "react";
import {
  Typography,
  Space,
  Button,
  Input,
  Select,
  Tooltip,
  Modal,
  Form,
  Divider,
  Checkbox,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ImportOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import {
  showInfoNotification,
  showWarningNotification,
  showSuccessNotification,
} from "../store/slices/uiSlice";
import {
  addTargetField,
  updateTargetField,
  removeTargetField,
  setTargetFields,
} from "../store/slices/dataSlice";
import { FieldInfo } from "../types";
import TargetFieldList from "./TargetFieldList";
import { generateId } from "../utils/helpers";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const RightPanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { targetFields } = useSelector((state: RootState) => state.data);
  const { rules } = useSelector((state: RootState) => state.mapping);

  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<FieldInfo | null>(null);
  const [form] = Form.useForm();

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // 处理类型过滤
  const handleFilterChange = (value: string) => {
    setFilterType(value);
  };

  // 过滤字段
  const filteredFields = targetFields.filter((field) => {
    const matchesSearch =
      !searchText ||
      field.name.toLowerCase().includes(searchText.toLowerCase()) ||
      field.path.toLowerCase().includes(searchText.toLowerCase());

    const matchesType = filterType === "all" || field.type === filterType;

    return matchesSearch && matchesType;
  });

  // 获取唯一的字段类型
  const fieldTypes = Array.from(new Set(targetFields.map((field) => field.type)));

  // 获取已映射的字段ID
  const mappedFieldIds = new Set(
    rules
      .map((rule) => {
        const targetField = targetFields.find((field) => field.name === rule.targetField);
        return targetField?.id;
      })
      .filter((id) => id !== undefined)
  );

  // 显示添加/编辑字段模态框
  const showFieldModal = (field?: FieldInfo) => {
    setEditingField(field || null);
    setIsModalVisible(true);

    if (field) {
      form.setFieldsValue({
        name: field.name,
        type: field.type,
        path: field.path,
        description: field.description,
        required: field.required,
        defaultValue: field.defaultValue,
      });
    } else {
      form.resetFields();
    }
  };

  // 处理字段保存
  const handleFieldSave = async () => {
    try {
      const values = await form.validateFields();

      const fieldData: FieldInfo = {
        id: editingField?.id || generateId(),
        name: values.name,
        type: values.type,
        path: values.path || values.name,
        description: values.description,
        required: values.required || false,
        defaultValue: values.defaultValue,
        nullable: true,
        sample: null,
      };

      if (editingField) {
        dispatch(updateTargetField({ name: editingField.name, field: fieldData }));
        dispatch(
          showSuccessNotification({
            title: "更新成功",
            message: "目标字段已更新",
          })
        );
      } else {
        dispatch(addTargetField(fieldData));
        dispatch(
          showSuccessNotification({
            title: "添加成功",
            message: "目标字段已添加",
          })
        );
      }

      setIsModalVisible(false);
      form.resetFields();
      setEditingField(null);
    } catch (error) {
      console.error("保存字段失败:", error);
    }
  };

  // 处理字段删除
  const handleFieldDelete = (fieldId: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "删除字段将同时删除相关的映射规则，确定要删除吗？",
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: () => {
        const fieldToDelete = targetFields.find((field) => field.id === fieldId);
        if (fieldToDelete) {
          dispatch(removeTargetField(fieldToDelete.name));
          dispatch(
            showSuccessNotification({
              title: "删除成功",
              message: "目标字段已删除",
            })
          );
        }
      },
    });
  };

  // 处理批量导入
  const handleImport = () => {
    // [TODO]: 实现批量导入功能
    dispatch(
      showInfoNotification({
        title: "提示",
        message: "批量导入功能开发中",
      })
    );
  };

  // 处理导出字段定义
  const handleExport = () => {
    if (targetFields.length === 0) {
      dispatch(
        showWarningNotification({
          title: "警告",
          message: "没有可导出的字段",
        })
      );
      return;
    }

    const exportData = {
      fields: targetFields,
      exportTime: new Date().toISOString(),
      version: "1.0",
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `target-fields-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    dispatch(
      showSuccessNotification({
        title: "导出成功",
        message: "字段定义已导出",
      })
    );
  };

  // 处理清空字段
  const handleClear = () => {
    if (targetFields.length === 0) {
      return;
    }

    Modal.confirm({
      title: "确认清空",
      content: "清空所有目标字段将同时删除所有映射规则，确定要清空吗？",
      okText: "清空",
      okType: "danger",
      cancelText: "取消",
      onOk: () => {
        dispatch(setTargetFields([]));
        dispatch(
          showSuccessNotification({
            title: "清空成功",
            message: "所有目标字段已清空",
          })
        );
      },
    });
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "auto" }}>
      {/* 头部 */}
      <div style={{ padding: "16px 16px 0", borderBottom: "1px solid #f0f0f0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <Title level={5} style={{ margin: 0 }}>
            目标字段
          </Title>

          <Space>
            <Tooltip title="添加字段">
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => showFieldModal()}
              >
                添加
              </Button>
            </Tooltip>
          </Space>
        </div>

        {/* 搜索和过滤 */}
        {targetFields.length > 0 && (
          <Space style={{ width: "100%", marginBottom: 16 }} direction="vertical" size={8}>
            <Search
              placeholder="搜索字段名称或路径"
              allowClear
              size="small"
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && setSearchText("")}
              style={{ width: "100%" }}
            />

            <Select
              size="small"
              style={{ width: "100%" }}
              placeholder="按类型过滤"
              allowClear
              value={filterType === "all" ? undefined : filterType}
              onChange={handleFilterChange}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="all">所有类型</Option>
              {fieldTypes.map((type) => (
                <Option key={type} value={type}>
                  {type}
                </Option>
              ))}
            </Select>
          </Space>
        )}

        {/* 操作按钮 */}
        {targetFields.length > 0 && (
          <>
            <Divider style={{ margin: "12px 0" }} />
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Space>
                <Tooltip title="导入字段">
                  <Button size="small" icon={<ImportOutlined />} onClick={handleImport}>
                    导入
                  </Button>
                </Tooltip>

                <Tooltip title="导出字段">
                  <Button size="small" icon={<ExportOutlined />} onClick={handleExport}>
                    导出
                  </Button>
                </Tooltip>
              </Space>

              <Button size="small" danger onClick={handleClear}>
                清空
              </Button>
            </Space>
          </>
        )}
      </div>

      {/* 字段列表 */}
      <div style={{ flex: 1, overflow: "hidden", padding: "0 16px 16px" }}>
        <TargetFieldList
          fields={filteredFields}
          mappedFieldIds={mappedFieldIds}
          searchText={searchText}
          onFieldEdit={showFieldModal}
          onFieldDelete={handleFieldDelete}
        />
      </div>

      {/* 底部统计信息 */}
      {targetFields.length > 0 && (
        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid #f0f0f0",
            background: "#fafafa",
            fontSize: 12,
            color: "#8c8c8c",
          }}
        >
          <Space split={<span>•</span>}>
            <span>字段: {targetFields.length}</span>
            <span>已映射: {mappedFieldIds.size}</span>
            <span>未映射: {targetFields.length - mappedFieldIds.size}</span>
          </Space>
        </div>
      )}

      {/* 添加/编辑字段模态框 */}
      <Modal
        title={editingField ? "编辑字段" : "添加字段"}
        open={isModalVisible}
        onOk={handleFieldSave}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingField(null);
        }}
        okText="保存"
        cancelText="取消"
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            type: "string",
            required: false,
          }}
        >
          <Form.Item
            label="字段名称"
            name="name"
            rules={[
              { required: true, message: "请输入字段名称" },
              {
                pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
                message: "字段名称只能包含字母、数字和下划线，且不能以数字开头",
              },
            ]}
          >
            <Input placeholder="例如: user_name" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="字段类型"
            name="type"
            rules={[{ required: true, message: "请选择字段类型" }]}
          >
            <Select placeholder="选择字段类型">
              <Option value="string">字符串</Option>
              <Option value="number">数字</Option>
              <Option value="boolean">布尔值</Option>
              <Option value="array">数组</Option>
              <Option value="object">对象</Option>
              <Option value="date">日期</Option>
              <Option value="null">空值</Option>
            </Select>
          </Form.Item>

          <Form.Item label="字段路径" name="path" tooltip="JSONPath表达式，如果为空则使用字段名称">
            <Input placeholder="例如: $.user.name" />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <Input.TextArea placeholder="字段描述信息" rows={3} maxLength={200} showCount />
          </Form.Item>

          <Form.Item label="默认值" name="defaultValue">
            <Input placeholder="字段默认值" />
          </Form.Item>

          <Form.Item name="required" valuePropName="checked">
            <Checkbox>必填字段</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RightPanel;
