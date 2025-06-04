import React, { useRef, useEffect, useState } from "react";
import { Card, Empty, Typography, Space, Button, Tooltip } from "antd";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  ReloadOutlined,
  FullscreenOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { MappingRule, FieldInfo, ValidationResult } from "../types";

const { Title, Text } = Typography;

interface MappingCanvasProps {
  rules: MappingRule[];
  validationResult?: ValidationResult;
}

interface CanvasNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  field: FieldInfo;
  type: "source" | "target";
}

interface CanvasConnection {
  id: string;
  sourceId: string;
  targetId: string;
  rule: MappingRule;
  hasError: boolean;
}

const MappingCanvas: React.FC<MappingCanvasProps> = ({ rules, validationResult }) => {
  const { sourceFields, targetFields } = useSelector((state: RootState) => state.data);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // 节点和连接数据
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [connections, setConnections] = useState<CanvasConnection[]>([]);

  // 初始化节点位置
  useEffect(() => {
    const sourceNodes: CanvasNode[] = sourceFields.map((field, index) => ({
      id: `source-${field.path}`,
      x: 50,
      y: 100 + index * 80,
      width: 200,
      height: 60,
      field,
      type: "source",
    }));

    const targetNodes: CanvasNode[] = targetFields.map((field, index) => ({
      id: `target-${field.path}`,
      x: 400,
      y: 100 + index * 80,
      width: 200,
      height: 60,
      field,
      type: "target",
    }));

    setNodes([...sourceNodes, ...targetNodes]);
  }, [sourceFields, targetFields]);

  // 更新连接
  useEffect(() => {
    const newConnections: CanvasConnection[] = rules.map((rule) => {
      const hasError = validationResult?.errors?.some((error) => error.field === rule.id) || false;
      return {
        id: rule.id,
        sourceId: `source-${rule.sourceField}`,
        targetId: `target-${rule.targetField}`,
        rule,
        hasError,
      };
    });
    setConnections(newConnections);
  }, [rules, validationResult]);

  // 绘制画布
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 应用变换
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(offset.x, offset.y);

    // 绘制网格
    drawGrid(ctx, canvas.width / scale, canvas.height / scale);

    // 绘制连接线
    connections.forEach((connection) => {
      drawConnection(ctx, connection);
    });

    // 绘制节点
    nodes.forEach((node) => {
      drawNode(ctx, node);
    });

    ctx.restore();
  }, [nodes, connections, scale, offset, selectedNode, hoveredNode]);

  // 绘制网格
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20;
    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // 绘制节点
  const drawNode = (ctx: CanvasRenderingContext2D, node: CanvasNode) => {
    const isSelected = selectedNode === node.id;
    const isHovered = hoveredNode === node.id;
    const isSource = node.type === "source";

    // 节点背景
    ctx.fillStyle = isSelected ? "#e6f7ff" : isHovered ? "#f6ffed" : "#ffffff";
    ctx.strokeStyle = isSelected ? "#1890ff" : isSource ? "#52c41a" : "#fa8c16";
    ctx.lineWidth = isSelected ? 3 : 2;

    // 绘制圆角矩形
    ctx.beginPath();
    const radius = 8;

    // 左上角
    ctx.moveTo(node.x + radius, node.y);
    // 上边
    ctx.lineTo(node.x + node.width - radius, node.y);
    // 右上角
    ctx.arc(node.x + node.width - radius, node.y + radius, radius, Math.PI * 1.5, 0, false);
    // 右边
    ctx.lineTo(node.x + node.width, node.y + node.height - radius);
    // 右下角
    ctx.arc(
      node.x + node.width - radius,
      node.y + node.height - radius,
      radius,
      0,
      Math.PI * 0.5,
      false
    );
    // 下边
    ctx.lineTo(node.x + radius, node.y + node.height);
    // 左下角
    ctx.arc(node.x + radius, node.y + node.height - radius, radius, Math.PI * 0.5, Math.PI, false);
    // 左边
    ctx.lineTo(node.x, node.y + radius);
    // 左上角
    ctx.arc(node.x + radius, node.y + radius, radius, Math.PI, Math.PI * 1.5, false);

    ctx.fill();
    ctx.stroke();

    // 节点文本
    ctx.fillStyle = "#262626";
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // 字段名称
    const fieldName = node.field.name || node.field.path.split(".").pop() || "";
    ctx.fillText(fieldName, node.x + 10, node.y + 10);

    // 字段类型
    ctx.fillStyle = "#8c8c8c";
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.fillText(node.field.type, node.x + 10, node.y + 30);

    // 字段路径
    ctx.fillStyle = "#bfbfbf";
    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    const path = node.field.path.length > 25 ? "..." + node.field.path.slice(-22) : node.field.path;
    ctx.fillText(path, node.x + 10, node.y + 45);

    // 连接点
    const connectionX = isSource ? node.x + node.width : node.x;
    const connectionY = node.y + node.height / 2;

    ctx.fillStyle = isSource ? "#52c41a" : "#fa8c16";
    ctx.beginPath();
    ctx.arc(connectionX, connectionY, 6, 0, 2 * Math.PI);
    ctx.fill();
  };

  // 绘制连接线
  const drawConnection = (ctx: CanvasRenderingContext2D, connection: CanvasConnection) => {
    const sourceNode = nodes.find((n) => n.id === connection.sourceId);
    const targetNode = nodes.find((n) => n.id === connection.targetId);

    if (!sourceNode || !targetNode) return;

    const startX = sourceNode.x + sourceNode.width;
    const startY = sourceNode.y + sourceNode.height / 2;
    const endX = targetNode.x;
    const endY = targetNode.y + targetNode.height / 2;

    // 贝塞尔曲线控制点
    const controlX1 = startX + (endX - startX) * 0.5;
    const controlY1 = startY;
    const controlX2 = startX + (endX - startX) * 0.5;
    const controlY2 = endY;

    // 连接线样式
    ctx.strokeStyle = connection.hasError ? "#ff4d4f" : "#1890ff";
    ctx.lineWidth = 3;
    ctx.setLineDash(connection.hasError ? [5, 5] : []);

    // 绘制贝塞尔曲线
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY);
    ctx.stroke();

    // 箭头
    const arrowSize = 8;
    const angle = Math.atan2(endY - controlY2, endX - controlX2);

    ctx.fillStyle = connection.hasError ? "#ff4d4f" : "#1890ff";
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle - Math.PI / 6),
      endY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle + Math.PI / 6),
      endY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    // 重置线条样式
    ctx.setLineDash([]);
  };

  // 获取鼠标在画布上的坐标
  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - offset.x * scale) / scale;
    const y = (clientY - rect.top - offset.y * scale) / scale;
    return { x, y };
  };

  // 查找鼠标位置的节点
  const findNodeAtPosition = (x: number, y: number): CanvasNode | null => {
    return (
      nodes.find(
        (node) =>
          x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height
      ) || null
    );
  };

  // 鼠标事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
    const node = findNodeAtPosition(x, y);

    if (node) {
      setSelectedNode(node.id);
    } else {
      setSelectedNode(null);
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x * scale, y: e.clientY - offset.y * scale });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: (e.clientX - dragStart.x) / scale,
        y: (e.clientY - dragStart.y) / scale,
      });
    } else {
      const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
      const node = findNodeAtPosition(x, y);
      setHoveredNode(node?.id || null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredNode(null);
  };

  // 缩放控制
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev / 1.2, 0.3));
  };

  const handleResetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleFullscreen = () => {
    const container = containerRef.current;
    if (container) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
      }
    }
  };

  // 调整画布大小
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  if (sourceFields.length === 0 && targetFields.length === 0) {
    return (
      <Card className="mapping-canvas-card">
        <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Text type="secondary">请先连接数据源并添加目标字段</Text>
        </Empty>
      </Card>
    );
  }

  return (
    <Card
      className="mapping-canvas-card"
      title={
        <Space>
          <Title level={5} style={{ margin: 0 }}>
            映射画布
          </Title>
          <Text type="secondary">({rules.length} 个映射规则)</Text>
        </Space>
      }
      extra={
        <Space>
          <Tooltip title="放大">
            <Button
              type="text"
              icon={<ZoomInOutlined />}
              onClick={handleZoomIn}
              disabled={scale >= 3}
            />
          </Tooltip>
          <Tooltip title="缩小">
            <Button
              type="text"
              icon={<ZoomOutOutlined />}
              onClick={handleZoomOut}
              disabled={scale <= 0.3}
            />
          </Tooltip>
          <Tooltip title="重置视图">
            <Button type="text" icon={<ReloadOutlined />} onClick={handleResetView} />
          </Tooltip>
          <Tooltip title="全屏">
            <Button type="text" icon={<FullscreenOutlined />} onClick={handleFullscreen} />
          </Tooltip>
        </Space>
      }
    >
      <div
        ref={containerRef}
        className="mapping-canvas-container"
        style={{
          width: "100%",
          height: "600px",
          position: "relative",
          overflow: "hidden",
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />

        {/* 缩放指示器 */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            background: "rgba(0, 0, 0, 0.6)",
            color: "white",
            padding: "4px 8px",
            borderRadius: 4,
            fontSize: 12,
          }}
        >
          {Math.round(scale * 100)}%
        </div>
      </div>
    </Card>
  );
};

export default MappingCanvas;
