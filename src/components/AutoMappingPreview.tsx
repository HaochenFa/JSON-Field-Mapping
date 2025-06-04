import React from "react";
import { Modal, Table, Button, Space, Tag, Switch } from "antd";
import { MappingRule, FieldInfo } from "../types";

interface AutoMappingPreviewProps {
  open: boolean;
  mappings: (MappingRule & { confidence?: number })[];
  sourceFields: FieldInfo[];
  targetFields: FieldInfo[];
  onConfirm: (selectedMappings: MappingRule[]) => void;
  onCancel: () => void;
}

const AutoMappingPreview: React.FC<AutoMappingPreviewProps> = ({
  open,
  mappings,
  sourceFields,
  targetFields,
  onConfirm,
  onCancel,
}) => {
  const [selectedMappings, setSelectedMappings] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    // 默认选中所有映射
    const selected: Record<string, boolean> = {};
    mappings.forEach((mapping) => {
      selected[mapping.id] = true;
    });
    setSelectedMappings(selected);
  }, [mappings]);

  const handleConfirm = () => {
    const confirmedMappings = mappings.filter((mapping) => selectedMappings[mapping.id]);
    onConfirm(confirmedMappings);
  };

  const handleToggleMapping = (id: string, checked: boolean) => {
    setSelectedMappings((prev) => ({
      ...prev,
      [id]: checked,
    }));
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return "";
    if (confidence >= 0.9) return "green";
    if (confidence >= 0.7) return "lime";
    if (confidence >= 0.5) return "orange";
    return "red";
  };

  const columns = [
    {
      title: "选择",
      dataIndex: "id",
      key: "select",
      render: (id: string) => (
        <Switch
          checked={selectedMappings[id]}
          onChange={(checked) => handleToggleMapping(id, checked)}
          size="small"
        />
      ),
    },
    {
      title: "源字段",
      dataIndex: "sourceField",
      key: "sourceField",
      render: (text: string) => {
        const field = sourceFields.find((f) => f.name === text);
        return (
          <Space>
            <span>{text}</span>
            {field && <Tag color="blue">{field.type}</Tag>}
          </Space>
        );
      },
    },
    {
      title: "目标字段",
      dataIndex: "targetField",
      key: "targetField",
      render: (text: string) => {
        const field = targetFields.find((f) => f.name === text);
        return (
          <Space>
            <span>{text}</span>
            {field && <Tag color="green">{field.type}</Tag>}
          </Space>
        );
      },
    },
    {
      title: "匹配度",
      dataIndex: "confidence",
      key: "confidence",
      render: (confidence?: number) => (
        <Tag color={getConfidenceColor(confidence)}>
          {confidence ? Math.round(confidence * 100) + "%" : "未知"}
        </Tag>
      ),
    },
    {
      title: "类型兼容",
      dataIndex: "validated",
      key: "validated",
      render: (validated: boolean) => (
        <Tag color={validated ? "success" : "error"}>{validated ? "兼容" : "不兼容"}</Tag>
      ),
    },
  ];

  return (
    <Modal
      title="自动映射结果预览"
      open={open}
      width={800}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          disabled={Object.values(selectedMappings).every((v) => !v)}
        >
          确认选中的映射
        </Button>,
      ]}
    >
      <Table dataSource={mappings} columns={columns} rowKey="id" pagination={false} size="small" />
    </Modal>
  );
};

export default AutoMappingPreview;
