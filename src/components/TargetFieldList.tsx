import React from "react";
import { List, Typography, Space, Tag, Tooltip, Button, Empty, Badge, Popconfirm } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LinkOutlined,
  FolderOutlined,
  FileOutlined,
} from "@ant-design/icons";
import { useDrop } from "react-dnd";
import { FieldInfo } from "../types";
import { copyToClipboard } from "../utils/helpers";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store";
import { showSuccessNotification } from "../store/slices/uiSlice";

const { Text, Paragraph } = Typography;

interface TargetFieldListProps {
  fields: FieldInfo[];
  mappedFieldIds: Set<string>;
  searchText?: string;
  onFieldEdit?: (field: FieldInfo) => void;
  onFieldDelete?: (fieldId: string) => void;
  onFieldMap?: (field: FieldInfo, sourceField: FieldInfo) => void;
}

interface TargetFieldItemProps {
  field: FieldInfo;
  isMapped: boolean;
  searchText?: string;
  onFieldEdit?: (field: FieldInfo) => void;
  onFieldDelete?: (fieldId: string) => void;
  onFieldMap?: (field: FieldInfo, sourceField: FieldInfo) => void;
}

// 目标字段项组件
const TargetFieldItem: React.FC<TargetFieldItemProps> = ({
  field,
  isMapped,
  searchText,
  onFieldEdit,
  onFieldDelete,
  onFieldMap,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  // 拖拽接收
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "source-field",
    drop: (item: { field: FieldInfo; type: "source" }) => {
      onFieldMap?.(field, item.field);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // 高亮搜索文本
  const highlightText = (text: string, search?: string): React.ReactNode => {
    if (!search) return text;

    const parts = text.split(new RegExp(`(${search})`, "gi"));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={index} style={{ background: "#ffe58f", padding: 0 }}>
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

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

  // 获取类型图标
  const getTypeIcon = (type: string): React.ReactNode => {
    switch (type) {
      case "object":
        return <FolderOutlined />;
      case "array":
        return <FileOutlined />;
      default:
        return <></>; // 返回空的 Fragment 而不是 null
    }
  };

  // 处理复制路径
  const handleCopyPath = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyToClipboard(field.path);
    dispatch(
      showSuccessNotification({
        title: "复制成功",
        message: "字段路径已复制到剪贴板",
      })
    );
  };

  // 处理编辑
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFieldEdit?.(field);
  };

  // 处理删除
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFieldDelete?.(field.id || "");
  };

  return (
    <div ref={drop}>
      <List.Item
        style={{
          padding: "12px",
          border: "1px solid #f0f0f0",
          borderRadius: 4,
          marginBottom: 8,
          background: isOver && canDrop ? "#f6ffed" : "#fff",
          borderColor: isOver && canDrop ? "#52c41a" : "#f0f0f0",
          borderStyle: isOver && canDrop ? "dashed" : "solid",
          transition: "all 0.2s ease",
          position: "relative",
        }}
        className="target-field-item"
      >
        {/* 映射状态指示器 */}
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 1,
          }}
        >
          {isMapped ? (
            <Tooltip title="已映射">
              <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
            </Tooltip>
          ) : (
            <Tooltip title="未映射">
              <ExclamationCircleOutlined style={{ color: "#faad14", fontSize: 16 }} />
            </Tooltip>
          )}
        </div>

        <div style={{ width: "100%", paddingRight: 24 }}>
          {/* 字段名称和类型 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Space size={4}>
              {getTypeIcon(field.type)}
              <Text strong style={{ fontSize: 14 }}>
                {highlightText(field.name, searchText)}
              </Text>
            </Space>

            <Space size={4}>
              <Tag color={getTypeColor(field.type)}>{field.type}</Tag>

              {field.required && <Tag color="red">必填</Tag>}
            </Space>
          </div>

          {/* 字段路径 */}
          <div style={{ marginBottom: 8 }}>
            <Space size={8} style={{ width: "100%", justifyContent: "space-between" }}>
              <Text
                type="secondary"
                style={{ fontSize: 12, fontFamily: "Monaco, monospace" }}
                ellipsis
              >
                {highlightText(field.path, searchText)}
              </Text>

              <Tooltip title="复制路径">
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={handleCopyPath}
                  style={{ padding: 0, height: 16, width: 16 }}
                />
              </Tooltip>
            </Space>
          </div>

          {/* 字段描述 */}
          {field.description && (
            <Paragraph
              style={{ margin: "0 0 8px 0", fontSize: 12, color: "#8c8c8c" }}
              ellipsis={{ rows: 2, tooltip: field.description }}
            >
              {highlightText(field.description, searchText)}
            </Paragraph>
          )}

          {/* 默认值 */}
          {field.defaultValue && (
            <div style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 11, color: "#8c8c8c" }}>默认值:</Text>
              <Text
                code
                style={{ fontSize: 11, background: "#f6f8fa", padding: "1px 4px", borderRadius: 2 }}
              >
                {String(field.defaultValue)}
              </Text>
            </div>
          )}

          {/* 操作按钮 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              {isOver && canDrop && (
                <Text type="success" style={{ fontSize: 11 }}>
                  <LinkOutlined /> 拖拽到此处创建映射
                </Text>
              )}
            </div>

            <Space size={4}>
              <Tooltip title="编辑字段">
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
                description="删除字段将同时删除相关的映射规则"
                onConfirm={(e) => handleDelete(e as React.MouseEvent)}
                okText="删除"
                cancelText="取消"
                okType="danger"
              >
                <Tooltip title="删除字段">
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    danger
                    style={{ padding: "2px 4px", height: 20 }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Tooltip>
              </Popconfirm>
            </Space>
          </div>
        </div>
      </List.Item>
    </div>
  );
};

const TargetFieldList: React.FC<TargetFieldListProps> = ({
  fields,
  mappedFieldIds,
  searchText,
  onFieldEdit,
  onFieldDelete,
  onFieldMap,
}) => {
  if (fields.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            searchText ? (
              <span>未找到匹配 "{searchText}" 的字段</span>
            ) : (
              <div>
                <div>暂无目标字段</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  点击右上角"添加"按钮创建目标字段
                </Text>
              </div>
            )
          }
        />
      </div>
    );
  }

  // 统计信息
  const mappedCount = fields.filter((field) => field.id && mappedFieldIds.has(field.id)).length;
  const unmappedCount = fields.length - mappedCount;

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      {/* 统计信息 */}
      <div style={{ padding: "8px 12px", background: "#fafafa", marginBottom: 8, borderRadius: 4 }}>
        <Space split={<span>•</span>}>
          <Space size={4}>
            <Badge count={mappedCount} size="small" style={{ backgroundColor: "#52c41a" }} />
            <Text style={{ fontSize: 12 }}>已映射</Text>
          </Space>
          <Space size={4}>
            <Badge count={unmappedCount} size="small" style={{ backgroundColor: "#faad14" }} />
            <Text style={{ fontSize: 12 }}>未映射</Text>
          </Space>
        </Space>
      </div>

      {/* 字段列表 */}
      <List
        size="small"
        dataSource={fields}
        renderItem={(field) => (
          <TargetFieldItem
            key={field.id || `target-field-${field.name}-${field.path}`}
            field={field}
            isMapped={field.id ? mappedFieldIds.has(field.id) : false}
            searchText={searchText}
            onFieldEdit={onFieldEdit}
            onFieldDelete={onFieldDelete}
            onFieldMap={onFieldMap}
          />
        )}
        style={{ padding: "0 4px" }}
      />
    </div>
  );
};

export default TargetFieldList;
