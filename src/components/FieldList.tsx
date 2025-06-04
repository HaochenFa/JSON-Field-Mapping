import React, { useState } from "react";
import { List, Typography, Space, Tag, Tooltip, Button, Empty, Badge, Collapse } from "antd";
import { DragOutlined, CopyOutlined, FolderOutlined, FileOutlined } from "@ant-design/icons";
import { useDrag } from "react-dnd";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store";
import { showSuccessNotification } from "../store/slices/uiSlice";
import { FieldInfo } from "../types";
import { copyToClipboard } from "../utils/helpers";

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface FieldListProps {
  fields: FieldInfo[];
  searchText?: string;
  onFieldSelect?: (field: FieldInfo) => void;
  showDragHandle?: boolean;
  groupByType?: boolean;
}

interface DraggableFieldItemProps {
  field: FieldInfo;
  searchText?: string;
  onFieldSelect?: (field: FieldInfo) => void;
  showDragHandle?: boolean;
  dispatch: AppDispatch;
}

// 可拖拽的字段项组件
const DraggableFieldItem: React.FC<DraggableFieldItemProps> = ({
  field,
  searchText,
  onFieldSelect,
  showDragHandle = true,
  dispatch,
}) => {
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: "source-field",
    item: { field, type: "source" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
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

  // 处理字段选择
  const handleFieldClick = () => {
    onFieldSelect?.(field);
  };

  return (
    <div ref={dragPreview}>
      <List.Item
        style={{
          opacity: isDragging ? 0.5 : 1,
          cursor: showDragHandle ? "move" : "pointer",
          padding: "8px 12px",
          border: "1px solid #f0f0f0",
          borderRadius: 4,
          marginBottom: 4,
          background: "#fff",
          transition: "all 0.2s ease",
        }}
        className="field-list-item"
        onClick={handleFieldClick}
      >
        <div style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <Space size={4}>
              {showDragHandle && (
                <div ref={drag} style={{ cursor: "move", color: "#8c8c8c" }}>
                  <DragOutlined />
                </div>
              )}

              <Space size={4}>
                {getTypeIcon(field.type)}
                <Text strong style={{ fontSize: 13 }}>
                  {highlightText(field.name, searchText)}
                </Text>
              </Space>
            </Space>

            <Space size={4}>
              <Tag color={getTypeColor(field.type)}>{field.type}</Tag>

              {field.required && <Tag color="red">必填</Tag>}
            </Space>
          </div>

          <div style={{ marginBottom: 4 }}>
            <Space size={8} style={{ width: "100%", justifyContent: "space-between" }}>
              <Text
                type="secondary"
                style={{ fontSize: 11, fontFamily: "Monaco, monospace" }}
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

          {field.description && (
            <Paragraph
              style={{ margin: 0, fontSize: 11, color: "#8c8c8c" }}
              ellipsis={{ rows: 2, tooltip: field.description }}
            >
              {highlightText(field.description, searchText)}
            </Paragraph>
          )}

          {field.sample !== null && field.sample !== undefined && (
            <div style={{ marginTop: 4 }}>
              <Text
                code
                style={{ fontSize: 10, background: "#f6f8fa", padding: "1px 4px", borderRadius: 2 }}
                ellipsis
              >
                示例: {String(field.sample)}
              </Text>
            </div>
          )}
        </div>
      </List.Item>
    </div>
  );
};

const FieldList: React.FC<FieldListProps> = ({
  fields,
  searchText,
  onFieldSelect,
  showDragHandle = true,
  groupByType = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["string", "number", "object"]);

  // 按类型分组
  const groupedFields = React.useMemo(() => {
    if (!groupByType) {
      return { all: fields };
    }

    const groups: Record<string, FieldInfo[]> = {};
    fields.forEach((field) => {
      if (!groups[field.type]) {
        groups[field.type] = [];
      }
      groups[field.type].push(field);
    });

    // 按类型排序
    const sortedGroups: Record<string, FieldInfo[]> = {};
    const typeOrder = ["string", "number", "boolean", "array", "object", "date", "null"];

    typeOrder.forEach((type) => {
      if (groups[type]) {
        sortedGroups[type] = groups[type];
      }
    });

    // 添加其他类型
    Object.keys(groups).forEach((type) => {
      if (!typeOrder.includes(type)) {
        sortedGroups[type] = groups[type];
      }
    });

    return sortedGroups;
  }, [fields, groupByType]);

  // 处理分组展开/收起
  const handleGroupChange = (activeKeys: string | string[]) => {
    setExpandedGroups(Array.isArray(activeKeys) ? activeKeys : [activeKeys]);
  };

  if (fields.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={searchText ? <span>未找到匹配 "{searchText}" 的字段</span> : "暂无字段数据"}
        />
      </div>
    );
  }

  if (!groupByType) {
    return (
      <div style={{ height: "100%", overflow: "auto" }}>
        <List
          size="small"
          dataSource={fields}
          renderItem={(field) => (
            <DraggableFieldItem
              key={field.id}
              field={field}
              searchText={searchText}
              onFieldSelect={onFieldSelect}
              showDragHandle={showDragHandle}
              dispatch={dispatch}
            />
          )}
          style={{ padding: "0 4px" }}
        />
      </div>
    );
  }

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <Collapse activeKey={expandedGroups} onChange={handleGroupChange} size="small" ghost>
        {Object.entries(groupedFields).map(([type, typeFields]) => {
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

          return (
            <Panel
              key={type}
              header={
                <Space>
                  <Tag color={getTypeColor(type)}>{type}</Tag>
                  <Badge count={typeFields.length} size="small" />
                </Space>
              }
            >
              <List
                size="small"
                dataSource={typeFields}
                renderItem={(field) => (
                  <DraggableFieldItem
                    key={field.id}
                    field={field}
                    searchText={searchText}
                    onFieldSelect={onFieldSelect}
                    showDragHandle={showDragHandle}
                    dispatch={dispatch}
                  />
                )}
                style={{ padding: "0 4px" }}
              />
            </Panel>
          );
        })}
      </Collapse>
    </div>
  );
};

export default FieldList;
