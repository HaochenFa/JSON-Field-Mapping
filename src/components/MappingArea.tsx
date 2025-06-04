import React, { useState } from "react";
import { Empty, Typography, Space, Button, Tooltip, Alert, Switch, Select } from "antd";
import {
  LinkOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { clearMappings, validateAllMappings, addMapping } from "../store/slices/mappingSlice";
import { showSuccessNotification, showErrorNotification } from "../store/slices/uiSlice";
import MappingList from "./MappingList";
import MappingCanvas from "./MappingCanvas";
import { useDrop } from "react-dnd";
import {
  FieldInfo,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  MappingRule,
} from "../types";
import AutoMappingPreview from "./AutoMappingPreview";
import { getFieldNameSimilarity, generateId } from "../utils/helpers";

const { Title, Text } = Typography;
const { Option } = Select;

const MappingArea: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rules } = useSelector((state: RootState) => state.mapping);
  const [validationResult, setValidationResult] = useState<ValidationResult | undefined>();
  const { sourceFields, targetFields } = useSelector((state: RootState) => state.data);
  const { status } = useSelector((state: RootState) => state.connection);

  const [viewMode, setViewMode] = useState<"list" | "canvas">("list");
  const [showValidation, setShowValidation] = useState(true);
  const [autoMappingThreshold, setAutoMappingThreshold] = useState(0.8);

  // 拖拽处理
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ["source-field", "target-field"],
    drop: (item: { field: FieldInfo; type: "source" | "target" }, monitor) => {
      if (!monitor.didDrop()) {
        // 处理拖拽到映射区域的逻辑
        // console.log("拖拽到映射区域:", item); // 注释掉调试代码

        // 根据拖拽项类型处理映射
        if (item.type === "source") {
          // 源字段拖拽 - 查找名称匹配度最高的目标字段
          const matchingTargetField =
            targetFields.find((tf) => tf.name.toLowerCase() === item.field.name.toLowerCase()) ||
            targetFields.find(
              (tf) =>
                tf.name.toLowerCase().includes(item.field.name.toLowerCase()) ||
                item.field.name.toLowerCase().includes(tf.name.toLowerCase())
            );

          if (matchingTargetField) {
            // 创建映射关系
            dispatch(
              addMapping({
                sourceField: item.field.name,
                targetField: matchingTargetField.name,
              })
            );

            dispatch(
              showSuccessNotification({
                title: "映射创建成功",
                message: `已创建 ${item.field.name} → ${matchingTargetField.name} 的映射关系`,
              })
            );
          } else {
            dispatch(
              showErrorNotification({
                title: "映射创建失败",
                message: "未找到匹配的目标字段，请手动创建映射",
              })
            );
          }
        } else if (item.type === "target") {
          // 目标字段拖拽 - 查找名称匹配度最高的源字段
          const matchingSourceField =
            sourceFields.find((sf) => sf.name.toLowerCase() === item.field.name.toLowerCase()) ||
            sourceFields.find(
              (sf) =>
                sf.name.toLowerCase().includes(item.field.name.toLowerCase()) ||
                item.field.name.toLowerCase().includes(sf.name.toLowerCase())
            );

          if (matchingSourceField) {
            // 创建映射关系
            dispatch(
              addMapping({
                sourceField: matchingSourceField.name,
                targetField: item.field.name,
              })
            );

            dispatch(
              showSuccessNotification({
                title: "映射创建成功",
                message: `已创建 ${matchingSourceField.name} → ${item.field.name} 的映射关系`,
              })
            );
          } else {
            dispatch(
              showErrorNotification({
                title: "映射创建失败",
                message: "未找到匹配的源字段，请手动创建映射",
              })
            );
          }
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  // 处理清空映射
  const handleClearMappings = () => {
    if (rules.length === 0) {
      return;
    }

    dispatch(clearMappings());
    dispatch(
      showSuccessNotification({
        title: "清空成功",
        message: "所有映射规则已清空",
      })
    );
  };

  // 处理验证映射
  const handleValidateMappings = () => {
    if (rules.length === 0) {
      dispatch(
        showErrorNotification({
          title: "验证失败",
          message: "没有可验证的映射规则",
        })
      );
      return;
    }

    dispatch(validateAllMappings({ sourceFields, targetFields }));

    // 创建验证结果
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 检查每个规则的有效性
    for (const rule of rules) {
      if (!rule.validated) {
        errors.push({
          field: rule.id, // 修改为rule.id而不是rule.targetField
          ruleId: rule.id, // 添加ruleId属性以保持兼容性
          message: `字段 "${rule.sourceField}" 到 "${rule.targetField}" 的映射类型不兼容`,
          type: "type_mismatch",
        });
      }
    }

    // 设置验证结果
    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors: errors,
      warnings: warnings,
    };

    setValidationResult(result);

    // 显示验证结果通知
    if (result.isValid) {
      dispatch(
        showSuccessNotification({
          title: "验证成功",
          message: "所有映射规则验证通过",
        })
      );
    } else {
      dispatch(
        showErrorNotification({
          title: "验证失败",
          message: `发现 ${result.errors.length} 个错误`,
        })
      );
    }
  };

  // 处理自动映射
  // 添加状态
  const [autoMappingResults, setAutoMappingResults] = useState<
    (MappingRule & { confidence?: number })[]
  >([]);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  // 自动映射处理函数 - 显示预览弹窗
  const handleAutoMapping = () => {
    if (sourceFields.length === 0 || targetFields.length === 0) {
      dispatch(
        showErrorNotification({
          title: "自动映射失败",
          message: "需要源字段和目标字段才能进行自动映射",
        })
      );
      return;
    }

    // 判断是否预览弹窗已经打开
    if (isPreviewVisible) {
      // 如果预览模式已经打开，不做任何操作
      return;
    }

    // 计算匹配结果并显示预览弹窗
    const results: (MappingRule & { confidence?: number })[] = [];
    const usedSourceFields = new Set<string>();

    targetFields.forEach((targetField) => {
      // 按相似度对源字段进行排序
      const matchedFields = sourceFields
        .filter((sf) => !usedSourceFields.has(sf.name))
        .map((sf) => ({
          field: sf,
          similarity: getFieldNameSimilarity(sf.name, targetField.name, { considerType: true }),
        }))
        .filter((match) => match.similarity >= autoMappingThreshold)
        .sort((a, b) => b.similarity - a.similarity);

      if (matchedFields.length > 0) {
        const bestMatch = matchedFields[0];
        usedSourceFields.add(bestMatch.field.name);

        results.push({
          id: generateId(),
          sourceField: bestMatch.field.name,
          targetField: targetField.name,
          validated:
            bestMatch.field.type === targetField.type ||
            (bestMatch.field.type === "string" &&
              targetField.type !== "object" &&
              targetField.type !== "array") ||
            (bestMatch.field.type === "number" && targetField.type === "string"),
          transform: {
            type: "direct",
            nullable: false,
          },
          confidence: bestMatch.similarity,
        });
      }
    });

    if (results.length > 0) {
      // 显示预览弹窗
      setAutoMappingResults(results);
      setIsPreviewVisible(true);
    } else {
      // 如果没有匹配结果，直接显示错误通知
      dispatch(
        showErrorNotification({
          title: "自动映射失败",
          message: "未找到匹配的字段进行映射",
        })
      );
    }
  };

  // 处理确认自动映射
  const handleConfirmAutoMapping = (selectedMappings: MappingRule[]) => {
    // 清除现有映射
    dispatch(clearMappings());

    // 添加选中的映射
    selectedMappings.forEach((mapping) => {
      dispatch(
        addMapping({
          sourceField: mapping.sourceField,
          targetField: mapping.targetField,
        })
      );
    });

    setIsPreviewVisible(false);

    dispatch(
      showSuccessNotification({
        title: "自动映射完成",
        message: `成功创建 ${selectedMappings.length} 个映射规则`,
      })
    );
  };

  // 注意：我们使用预览模式进行自动映射，不需要直接应用的函数

  // 处理视图模式切换
  const handleViewModeChange = (mode: "list" | "canvas") => {
    setViewMode(mode);
  };

  const hasSourceFields = sourceFields.length > 0;
  const hasTargetFields = targetFields.length > 0;
  const hasMappings = rules.length > 0;
  const isConnected = status === "connected";

  // 验证结果统计
  const validMappings = validationResult?.isValid
    ? rules.length
    : rules.length - (validationResult?.errors?.length || 0);
  const invalidMappings = validationResult?.errors?.length || 0;

  return (
    <div
      ref={drop}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: isOver && canDrop ? "#f6ffed" : "transparent",
        border: isOver && canDrop ? "2px dashed #52c41a" : "none",
        transition: "all 0.3s ease",
      }}
    >
      {/* 头部工具栏 */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0f0f0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <Title level={5} style={{ margin: 0 }}>
            映射配置
          </Title>

          <Space>
            {/* 视图模式切换 */}
            <Select
              size="small"
              value={viewMode}
              onChange={handleViewModeChange}
              style={{ width: 100 }}
            >
              <Option value="list">列表视图</Option>
              <Option value="canvas">画布视图</Option>
            </Select>

            {/* 显示验证结果开关 */}
            <Space size={4}>
              <Text style={{ fontSize: 12 }}>显示验证</Text>
              <Switch
                size="small"
                checked={showValidation}
                onChange={setShowValidation}
                checkedChildren={<EyeOutlined />}
                unCheckedChildren={<EyeInvisibleOutlined />}
              />
            </Space>
          </Space>
        </div>

        {/* 操作按钮 */}
        <Space wrap>
          <Tooltip title="自动映射相似字段">
            <Button
              icon={<ThunderboltOutlined />}
              onClick={handleAutoMapping}
              disabled={!hasSourceFields || !hasTargetFields}
              size="small"
            >
              自动映射
            </Button>
          </Tooltip>

          <Tooltip title="验证所有映射规则">
            <Button
              icon={<CheckCircleOutlined />}
              onClick={handleValidateMappings}
              disabled={!hasMappings}
              size="small"
            >
              验证映射
            </Button>
          </Tooltip>

          <Tooltip title="清空所有映射">
            <Button
              icon={<ClearOutlined />}
              onClick={handleClearMappings}
              disabled={!hasMappings}
              danger
              size="small"
            >
              清空映射
            </Button>
          </Tooltip>

          {/* 自动映射阈值设置 */}
          <Space size={4}>
            <Text style={{ fontSize: 12 }}>相似度阈值:</Text>
            <Select
              size="small"
              value={autoMappingThreshold}
              onChange={setAutoMappingThreshold}
              style={{ width: 80 }}
            >
              <Option value={0.6}>60%</Option>
              <Option value={0.7}>70%</Option>
              <Option value={0.8}>80%</Option>
              <Option value={0.9}>90%</Option>
            </Select>
          </Space>
        </Space>

        {/* 验证结果提示 */}
        {showValidation && validationResult && hasMappings && (
          <div style={{ marginTop: 12 }}>
            {validationResult.isValid ? (
              <Alert
                message={`验证通过: ${validMappings} 个映射规则全部有效`}
                type="success"
                showIcon
              />
            ) : (
              <Alert
                message={`验证失败: ${invalidMappings} 个错误, ${validMappings} 个有效`}
                description={
                  validationResult.errors &&
                  validationResult.errors.length > 0 && (
                    <ul style={{ margin: "4px 0 0 0", paddingLeft: 16 }}>
                      {validationResult.errors
                        .slice(0, 3)
                        .map((error: ValidationError, index: number) => (
                          <li key={index} style={{ fontSize: 12 }}>
                            {error.message}
                          </li>
                        ))}
                      {validationResult.errors.length > 3 && (
                        <li style={{ fontSize: 12, color: "#8c8c8c" }}>
                          还有 {validationResult.errors.length - 3} 个错误...
                        </li>
                      )}
                    </ul>
                  )
                }
                type="error"
                showIcon
              />
            )}
          </div>
        )}
      </div>

      {/* 主要内容区域 */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {!isConnected ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请先连接数据源" />
          </div>
        ) : !hasSourceFields && !hasTargetFields ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请先配置源字段和目标字段" />
          </div>
        ) : !hasSourceFields ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请先获取源数据字段" />
          </div>
        ) : !hasTargetFields ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请先添加目标字段" />
          </div>
        ) : !hasMappings ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Empty
              image={<LinkOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />}
              description={
                <div>
                  <Text>暂无映射规则</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    拖拽字段到此区域创建映射，或使用自动映射功能
                  </Text>
                </div>
              }
            >
              <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleAutoMapping}>
                开始自动映射
              </Button>
            </Empty>
          </div>
        ) : (
          <div style={{ height: "100%", padding: "0 24px 24px" }}>
            {viewMode === "list" ? (
              <MappingList
                rules={rules}
                validationResult={validationResult}
                showValidation={showValidation}
              />
            ) : (
              <MappingCanvas rules={rules} validationResult={validationResult} />
            )}
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      {hasMappings && (
        <div
          style={{
            padding: "8px 24px",
            borderTop: "1px solid #f0f0f0",
            background: "#fafafa",
            fontSize: 12,
            color: "#8c8c8c",
          }}
        >
          <Space split={<span>•</span>}>
            <span>映射规则: {rules.length}</span>
            {validationResult && (
              <>
                <span style={{ color: "#52c41a" }}>有效: {validMappings}</span>
                {invalidMappings > 0 && (
                  <span style={{ color: "#ff4d4f" }}>错误: {invalidMappings}</span>
                )}
              </>
            )}
            <span>完成度: {Math.round((rules.length / targetFields.length) * 100)}%</span>
          </Space>
        </div>
      )}

      {/* 自动映射预览弹窗 */}
      <AutoMappingPreview
        open={isPreviewVisible}
        mappings={autoMappingResults}
        sourceFields={sourceFields}
        targetFields={targetFields}
        onConfirm={handleConfirmAutoMapping}
        onCancel={() => setIsPreviewVisible(false)}
      />
    </div>
  );
};

export default MappingArea;
