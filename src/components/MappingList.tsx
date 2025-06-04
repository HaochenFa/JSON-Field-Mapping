import React, { useState } from "react";
import {
  List,
  Typography,
  Space,
  Tag,
  Tooltip,
  Button,
  Card,
  Empty,
  Alert,
  Popconfirm,
  Modal,
  Form,
  Input,
  Select,
  Switch,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import { updateMapping, removeMapping } from "../store/slices/mappingSlice";
import { showSuccessNotification, showErrorNotification } from "../store/slices/uiSlice";
import { MappingRule, ValidationResult } from "../types";
import { copyToClipboard } from "../utils/helpers";

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface MappingListProps {
  rules: MappingRule[];
  validationResult?: ValidationResult;
  showValidation?: boolean;
}

interface MappingRuleItemProps {
  rule: MappingRule;
  hasError?: boolean;
  errorMessage?: string;
  onEdit: (rule: MappingRule) => void;
  onDelete: (ruleId: string) => void;
}

// 映射规则项组件
const MappingRuleItem: React.FC<MappingRuleItemProps> = ({
  rule,
  hasError,
  errorMessage,
  onEdit,
  onDelete,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { sourceFields, targetFields } = useSelector((state: RootState) => state.data);

  // 获取类型颜色
  const getTypeColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      string: "blue",
      number: "green",
      boolean: "orange",
      array: "purple",
      object: "red",
      date: "cyan",
      null: "default",
    };
    return colorMap[type] || "default";
  };

  // 处理复制映射信息
  const handleCopyMapping = () => {
    // 从 sourceFields 和 targetFields 数组中查找对应的字段信息
    const sourceFieldInfo = sourceFields.find((field) => field.name === rule.sourceField);
    const targetFieldInfo = targetFields.find((field) => field.name === rule.targetField);

    if (!sourceFieldInfo || !targetFieldInfo) {
      dispatch(
        showErrorNotification({
          title: "复制失败",
          message: "无法找到完整的字段信息",
        })
      );
      return;
    }

    const mappingInfo = {
      source: {
        name: sourceFieldInfo.name,
        path: sourceFieldInfo.path,
        type: sourceFieldInfo.type,
      },
      target: {
        name: targetFieldInfo.name,
        path: targetFieldInfo.path,
        type: targetFieldInfo.type,
      },
      transform: rule.transform,
    };

    copyToClipboard(JSON.stringify(mappingInfo, null, 2));
    // 使用dispatch显示成功通知
    dispatch(
      showSuccessNotification({
        title: "复制成功",
        message: "映射信息已复制到剪贴板",
      })
    );
  };

  // 处理编辑
  const handleEdit = () => {
    onEdit(rule);
  };

  // 处理删除
  const handleDelete = () => {
    onDelete(rule.id);
  };

  return (
    <List.Item
      style={{
        padding: 0,
        marginBottom: 12,
      }}
    >
      <Card
        size="small"
        style={{
          width: "100%",
          border: hasError ? "1px solid #ff4d4f" : "1px solid #f0f0f0",
          borderRadius: 6,
        }}
        bodyStyle={{ padding: 12 }}
      >
        {/* 错误提示 */}
        {hasError && errorMessage && (
          <Alert message={errorMessage} type="error" showIcon style={{ marginBottom: 12 }} />
        )}

        {/* 映射关系 */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          {/* 源字段 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <Space size={4}>
                {(() => {
                  const sourceFieldInfo = sourceFields.find(
                    (field) => field.name === rule.sourceField
                  );
                  if (!sourceFieldInfo)
                    return (
                      <Text strong style={{ fontSize: 13 }}>
                        {rule.sourceField}
                      </Text>
                    );

                  return (
                    <>
                      <Text strong style={{ fontSize: 13 }}>
                        {sourceFieldInfo.name}
                      </Text>
                      <Tag color={getTypeColor(sourceFieldInfo.type)}>{sourceFieldInfo.type}</Tag>
                    </>
                  );
                })()}
              </Space>

              {(() => {
                const sourceFieldInfo = sourceFields.find(
                  (field) => field.name === rule.sourceField
                );
                if (!sourceFieldInfo) return null;

                return (
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, fontFamily: "Monaco, monospace" }}
                    ellipsis
                    title={sourceFieldInfo.path}
                  >
                    {sourceFieldInfo.path}
                  </Text>
                );
              })()}
            </Space>
          </div>

          {/* 箭头 */}
          <div style={{ padding: "0 16px", flexShrink: 0 }}>
            <ArrowRightOutlined style={{ color: hasError ? "#ff4d4f" : "#1890ff", fontSize: 16 }} />
          </div>

          {/* 目标字段 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <Space size={4}>
                {(() => {
                  const targetFieldInfo = targetFields.find(
                    (field) => field.name === rule.targetField
                  );
                  if (!targetFieldInfo)
                    return (
                      <Text strong style={{ fontSize: 13 }}>
                        {rule.targetField}
                      </Text>
                    );

                  return (
                    <>
                      <Text strong style={{ fontSize: 13 }}>
                        {targetFieldInfo.name}
                      </Text>
                      <Tag color={getTypeColor(targetFieldInfo.type)}>{targetFieldInfo.type}</Tag>
                      {targetFieldInfo.required && <Tag color="red">必填</Tag>}
                    </>
                  );
                })()}
              </Space>

              {(() => {
                const targetFieldInfo = targetFields.find(
                  (field) => field.name === rule.targetField
                );
                if (!targetFieldInfo) return null;

                return (
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, fontFamily: "Monaco, monospace" }}
                    ellipsis
                    title={targetFieldInfo.path}
                  >
                    {targetFieldInfo.path}
                  </Text>
                );
              })()}
            </Space>
          </div>
        </div>

        {/* 转换规则 */}
        {rule.transform && (
          <div style={{ marginBottom: 12, padding: 8, background: "#fafafa", borderRadius: 4 }}>
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <Space size={4}>
                <SettingOutlined style={{ color: "#1890ff", fontSize: 12 }} />
                <Text style={{ fontSize: 12, fontWeight: 500 }}>转换规则</Text>
              </Space>

              <div style={{ paddingLeft: 16 }}>
                <Space direction="vertical" size={2} style={{ width: "100%" }}>
                  <Space size={8}>
                    <Text style={{ fontSize: 11, color: "#8c8c8c" }}>类型:</Text>
                    <Tag>{rule.transform?.type}</Tag>
                  </Space>

                  {rule.transform?.expression && (
                    <div>
                      <Text style={{ fontSize: 11, color: "#8c8c8c" }}>表达式:</Text>
                      <Text
                        code
                        style={{ fontSize: 10, marginLeft: 8, background: "#f6f8fa" }}
                        ellipsis
                        title={rule.transform?.expression}
                      >
                        {rule.transform?.expression}
                      </Text>
                    </div>
                  )}

                  {rule.transform?.defaultValue !== undefined && (
                    <div>
                      <Text style={{ fontSize: 11, color: "#8c8c8c" }}>默认值:</Text>
                      <Text code style={{ fontSize: 10, marginLeft: 8, background: "#f6f8fa" }}>
                        {String(rule.transform?.defaultValue)}
                      </Text>
                    </div>
                  )}
                </Space>
              </div>
            </Space>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {hasError ? (
              <Space size={4}>
                <ExclamationCircleOutlined style={{ color: "#ff4d4f", fontSize: 12 }} />
                <Text type="danger" style={{ fontSize: 11 }}>
                  验证失败
                </Text>
              </Space>
            ) : (
              <Space size={4}>
                <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 12 }} />
                <Text type="success" style={{ fontSize: 11 }}>
                  验证通过
                </Text>
              </Space>
            )}
          </div>

          <Space size={4}>
            <Tooltip title="复制映射信息">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={handleCopyMapping}
                style={{ padding: "2px 4px", height: 20 }}
              />
            </Tooltip>

            <Tooltip title="编辑映射">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={handleEdit}
                style={{ padding: "2px 4px", height: 20 }}
              />
            </Tooltip>

            <Popconfirm
              title="确认删除"
              description="确定要删除这个映射规则吗？"
              onConfirm={handleDelete}
              okText="删除"
              cancelText="取消"
              okType="danger"
            >
              <Tooltip title="删除映射">
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  danger
                  style={{ padding: "2px 4px", height: 20 }}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        </div>
      </Card>
    </List.Item>
  );
};

const MappingList: React.FC<MappingListProps> = ({
  rules,
  validationResult,
  showValidation = true,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { sourceFields, targetFields } = useSelector((state: RootState) => state.data);
  const [editingRule, setEditingRule] = useState<MappingRule | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 获取错误信息映射
  const errorMap = React.useMemo(() => {
    const map = new Map<string, string>();
    if (validationResult?.errors) {
      validationResult.errors.forEach((error) => {
        if (error.ruleId) {
          map.set(error.ruleId, error.message);
        }
      });
    }
    return map;
  }, [validationResult]);

  // 处理编辑映射
  const handleEditRule = (rule: MappingRule) => {
    setEditingRule(rule);
    setIsModalVisible(true);

    // 设置表单初始值
    form.setFieldsValue({
      transformType: rule.transform?.type || "direct",
      expression: rule.transform?.expression || "",
      defaultValue: rule.transform?.defaultValue !== undefined ? rule.transform?.defaultValue : "",
      nullable: rule.transform?.nullable || false,
    });
  };

  // 处理删除映射
  const handleDeleteRule = (ruleId: string) => {
    dispatch(removeMapping(ruleId));
    dispatch(
      showSuccessNotification({
        title: "删除成功",
        message: "映射规则已删除",
      })
    );
  };

  // 处理保存编辑
  const handleSaveEdit = async () => {
    if (!editingRule) return;

    try {
      const values = await form.validateFields();

      const updatedRule: Partial<MappingRule> = {
        transform: {
          type: values.transformType,
          expression: values.expression || undefined,
          defaultValue: values.defaultValue !== undefined ? values.defaultValue : undefined,
          nullable: values.nullable,
        },
      };

      dispatch(updateMapping({ id: editingRule.id, updates: updatedRule }));
      dispatch(
        showSuccessNotification({
          title: "更新成功",
          message: "映射规则已更新",
        })
      );

      setIsModalVisible(false);
      setEditingRule(null);
      form.resetFields();
    } catch (error) {
      console.error("保存映射规则失败:", error);
    }
  };

  // 处理取消编辑
  const handleCancelEdit = () => {
    setIsModalVisible(false);
    setEditingRule(null);
    form.resetFields();
  };

  if (rules.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无映射规则" />
      </div>
    );
  }

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <List
        dataSource={rules}
        renderItem={(rule) => {
          const hasError = showValidation && errorMap.has(rule.id);
          const errorMessage = errorMap.get(rule.id);

          return (
            <MappingRuleItem
              key={rule.id}
              rule={rule}
              hasError={hasError}
              errorMessage={errorMessage}
              onEdit={handleEditRule}
              onDelete={handleDeleteRule}
            />
          );
        }}
      />

      {/* 编辑映射模态框 */}
      <Modal
        title="编辑映射规则"
        open={isModalVisible}
        onOk={handleSaveEdit}
        onCancel={handleCancelEdit}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        {editingRule && (
          <div>
            {/* 映射关系显示 */}
            <div style={{ marginBottom: 24, padding: 16, background: "#fafafa", borderRadius: 6 }}>
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Text strong>映射关系</Text>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <Space direction="vertical" size={2}>
                      {(() => {
                        const sourceFieldInfo = sourceFields.find(
                          (field) => field.name === editingRule.sourceField
                        );
                        return sourceFieldInfo ? (
                          <>
                            <Text>{sourceFieldInfo.name}</Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {sourceFieldInfo.path}
                            </Text>
                          </>
                        ) : (
                          <Text>{editingRule.sourceField}</Text>
                        );
                      })()}
                    </Space>
                  </div>
                  <ArrowRightOutlined style={{ margin: "0 16px", color: "#1890ff" }} />
                  <div style={{ flex: 1 }}>
                    <Space direction="vertical" size={2}>
                      {(() => {
                        const targetFieldInfo = targetFields.find(
                          (field) => field.name === editingRule.targetField
                        );
                        return targetFieldInfo ? (
                          <>
                            <Text>{targetFieldInfo.name}</Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {targetFieldInfo.path}
                            </Text>
                          </>
                        ) : (
                          <Text>{editingRule.targetField}</Text>
                        );
                      })()}
                    </Space>
                  </div>
                </div>
              </Space>
            </div>

            {/* 转换规则表单 */}
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                transformType: "direct",
                nullable: false,
              }}
            >
              <Form.Item
                label="转换类型"
                name="transformType"
                rules={[{ required: true, message: "请选择转换类型" }]}
              >
                <Select placeholder="选择转换类型">
                  <Option value="direct">直接映射</Option>
                  <Option value="expression">表达式转换</Option>
                  <Option value="constant">常量值</Option>
                  <Option value="format">格式化</Option>
                  <Option value="lookup">查找表</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="转换表达式"
                name="expression"
                tooltip="支持JavaScript表达式，使用 $value 引用源字段值"
              >
                <TextArea placeholder="例如: $value.toUpperCase() 或 $value * 100" rows={3} />
              </Form.Item>

              <Form.Item label="默认值" name="defaultValue" tooltip="当源字段值为空时使用的默认值">
                <Input placeholder="默认值" />
              </Form.Item>

              <Form.Item name="nullable" valuePropName="checked">
                <Switch /> 允许空值
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MappingList;
