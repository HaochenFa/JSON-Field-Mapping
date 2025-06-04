import React, { useState, useMemo } from "react";
import { Typography, Space, Button, Tooltip, Input, Select, Switch, Card } from "antd";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store";
import { showSuccessNotification } from "../store/slices/uiSlice";
import { CopyOutlined, DownloadOutlined, CodeOutlined } from "@ant-design/icons";
import { copyToClipboard, downloadFile } from "../utils/helpers";

const { Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface JsonViewProps {
  data: any[];
  maxHeight?: number;
}

const JsonView: React.FC<JsonViewProps> = ({ data }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchText, setSearchText] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [expandLevel, setExpandLevel] = useState<number>(2);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  // 过滤数据
  const filteredData = useMemo(() => {
    if (!searchText) {
      return data;
    }

    const searchLower = searchText.toLowerCase();
    return data.filter((item, index) => {
      const itemStr = JSON.stringify(item).toLowerCase();
      return itemStr.includes(searchLower) || index.toString().includes(searchText);
    });
  }, [data, searchText]);

  // 格式化JSON
  const formatJson = (obj: any, level: number = 0): string => {
    if (level > expandLevel) {
      if (Array.isArray(obj)) {
        return `[${obj.length} items]`;
      }
      if (obj && typeof obj === "object") {
        return `{${Object.keys(obj).length} keys}`;
      }
    }

    return JSON.stringify(obj, null, compactMode ? 0 : 2);
  };

  // 高亮搜索文本
  const highlightText = (text: string, search: string): React.ReactNode => {
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

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
    if (value && filteredData.length > 0) {
      setSelectedIndex(0);
    }
  };

  // 处理复制
  const handleCopy = (content: any) => {
    const jsonStr = typeof content === "string" ? content : JSON.stringify(content, null, 2);
    copyToClipboard(jsonStr);
    dispatch(
      showSuccessNotification({
        title: "成功",
        message: "JSON已复制到剪贴板",
      })
    );
  };

  // 处理下载
  const handleDownload = () => {
    const content =
      selectedIndex >= 0 && selectedIndex < filteredData.length
        ? filteredData[selectedIndex]
        : filteredData;

    const jsonStr = JSON.stringify(content, null, 2);
    const filename = `json-data-${Date.now()}.json`;
    downloadFile(jsonStr, filename, "application/json");
    dispatch(
      showSuccessNotification({
        title: "成功",
        message: "JSON文件已下载",
      })
    );
  };

  // 处理记录选择
  const handleRecordChange = (index: number) => {
    setSelectedIndex(index);
  };

  // 处理展开级别变化
  const handleExpandLevelChange = (level: number) => {
    setExpandLevel(level);
  };

  const currentData =
    selectedIndex >= 0 && selectedIndex < filteredData.length ? filteredData[selectedIndex] : null;

  const jsonContent = currentData ? formatJson(currentData) : "";
  const displayContent = highlightText(jsonContent, searchText);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* 工具栏 */}
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Search
            placeholder="搜索JSON内容"
            allowClear
            size="small"
            style={{ width: 200 }}
            onSearch={handleSearch}
            onChange={(e) => !e.target.value && setSearchText("")}
          />

          {filteredData.length > 1 && (
            <Select
              size="small"
              style={{ width: 150 }}
              value={selectedIndex}
              onChange={handleRecordChange}
              placeholder="选择记录"
            >
              {filteredData.map((_, index) => (
                <Option key={index} value={index}>
                  记录 {index + 1}
                </Option>
              ))}
            </Select>
          )}

          <Select
            size="small"
            style={{ width: 100 }}
            value={expandLevel}
            onChange={handleExpandLevelChange}
            placeholder="展开级别"
          >
            <Option value={1}>1级</Option>
            <Option value={2}>2级</Option>
            <Option value={3}>3级</Option>
            <Option value={4}>4级</Option>
            <Option value={99}>全部</Option>
          </Select>

          <Space size={4}>
            <Text style={{ fontSize: 12 }}>紧凑</Text>
            <Switch size="small" checked={compactMode} onChange={setCompactMode} />
          </Space>

          <Space size={4}>
            <Text style={{ fontSize: 12 }}>行号</Text>
            <Switch size="small" checked={showLineNumbers} onChange={setShowLineNumbers} />
          </Space>

          <Tooltip title="复制JSON">
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(currentData)}
              disabled={!currentData}
            >
              复制
            </Button>
          </Tooltip>

          <Tooltip title="下载JSON">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              disabled={filteredData.length === 0}
            >
              下载
            </Button>
          </Tooltip>
        </Space>
      </div>

      {/* JSON内容 */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {filteredData.length === 0 ? (
          <Card style={{ textAlign: "center", height: "100%" }}>
            <div style={{ padding: 48 }}>
              <CodeOutlined style={{ fontSize: 48, color: "#d9d9d9", marginBottom: 16 }} />
              <br />
              <Text type="secondary">{searchText ? "未找到匹配的数据" : "暂无JSON数据"}</Text>
            </div>
          </Card>
        ) : (
          <Card
            style={{ height: "100%", overflow: "hidden" }}
            bodyStyle={{ padding: 0, height: "100%" }}
          >
            <div
              style={{
                height: "100%",
                overflow: "auto",
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                fontSize: 12,
                lineHeight: 1.5,
                background: "#fafafa",
                position: "relative",
              }}
            >
              {showLineNumbers ? (
                <div style={{ display: "flex", height: "100%" }}>
                  {/* 行号 */}
                  <div
                    style={{
                      width: 40,
                      background: "#f0f0f0",
                      borderRight: "1px solid #e8e8e8",
                      padding: "12px 8px",
                      textAlign: "right",
                      color: "#8c8c8c",
                      fontSize: 11,
                      userSelect: "none",
                      flexShrink: 0,
                    }}
                  >
                    {jsonContent.split("\n").map((_, index) => (
                      <div key={index} style={{ height: 18 }}>
                        {index + 1}
                      </div>
                    ))}
                  </div>

                  {/* 内容 */}
                  <div
                    style={{
                      flex: 1,
                      padding: 12,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {displayContent}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: 12,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    height: "100%",
                  }}
                >
                  {displayContent}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* 底部信息 */}
      {filteredData.length > 0 && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "#8c8c8c",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Space split={<span>•</span>}>
            <span>记录: {filteredData.length}</span>
            {currentData && (
              <span>
                当前: {selectedIndex + 1}/{filteredData.length}
              </span>
            )}
            <span>
              大小: {(JSON.stringify(currentData || filteredData).length / 1024).toFixed(1)} KB
            </span>
          </Space>

          {searchText && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              搜索: "{searchText}"
            </Text>
          )}
        </div>
      )}
    </div>
  );
};

export default JsonView;
