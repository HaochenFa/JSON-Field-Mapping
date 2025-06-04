import React, { useState } from "react";
import { Tabs, Empty, Typography, Space, Button, Tooltip, Input, Select } from "antd";
import {
  TableOutlined,
  CodeOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { setLeftPanelView } from "../store/slices/uiSlice";
import { fetchSourceData } from "../store/slices/dataSlice";
import DataTable from "./DataTable";
import JsonView from "./JsonView";
import FieldList from "./FieldList";

const { Title } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;
const { Option } = Select;

// 定义左侧面板视图类型，确保与 uiSlice 中的类型兼容
type LeftPanelViewType = "table" | "json" | "fields";

const LeftPanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { leftPanelView } = useSelector((state: RootState) => state.ui);
  const { source, sourceFields, loading, pagination } = useSelector(
    (state: RootState) => state.data
  );
  const { status } = useSelector((state: RootState) => state.connection);

  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // 处理标签页切换
  const handleTabChange = (activeKey: string) => {
    // 使用自定义类型确保类型安全
    dispatch(setLeftPanelView(activeKey as LeftPanelViewType));
  };

  // 处理数据刷新
  const handleRefresh = async () => {
    if (status === "connected") {
      try {
        await dispatch(fetchSourceData({ page: 1, pageSize: 100 })).unwrap();
      } catch (error) {
        console.error("刷新数据失败:", error);
      }
    }
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // 处理类型过滤
  const handleFilterChange = (value: string) => {
    setFilterType(value);
  };

  // 过滤字段
  const filteredFields = sourceFields.filter((field) => {
    const matchesSearch =
      !searchText ||
      field.name.toLowerCase().includes(searchText.toLowerCase()) ||
      field.path.toLowerCase().includes(searchText.toLowerCase());

    const matchesType = filterType === "all" || field.type === filterType;

    return matchesSearch && matchesType;
  });

  // 获取唯一的字段类型
  const fieldTypes = Array.from(new Set(sourceFields.map((field) => field.type)));

  const hasData = source.length > 0;
  const isConnected = status === "connected";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
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
            数据源
          </Title>

          <Space>
            <Tooltip title="刷新数据">
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
                disabled={!isConnected}
              />
            </Tooltip>
          </Space>
        </div>

        {/* 搜索和过滤 */}
        {hasData && leftPanelView === "fields" && (
          <Space style={{ width: "100%", marginBottom: 16 }} direction="vertical" size={8}>
            <Search
              placeholder="搜索字段名称或路径"
              allowClear
              size="small"
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && setSearchText("")}
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
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {!isConnected ? (
          <div style={{ padding: 24 }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请先连接数据源" />
          </div>
        ) : !hasData ? (
          <div style={{ padding: 24 }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
          </div>
        ) : (
          <Tabs
            activeKey={leftPanelView}
            onChange={handleTabChange}
            size="small"
            style={{ height: "100%" }}
            tabBarStyle={{ padding: "0 16px", margin: 0 }}
          >
            <TabPane
              tab={
                <span>
                  <TableOutlined />
                  表格视图
                </span>
              }
              key="table"
              style={{ height: "100%", overflow: "hidden" }}
            >
              <div style={{ height: "100%", padding: "0 16px 16px" }}>
                <DataTable
                  data={source}
                  loading={loading}
                  pagination={pagination}
                  onPageChange={(page, pageSize) => {
                    dispatch(fetchSourceData({ page, pageSize }));
                  }}
                />
              </div>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <CodeOutlined />
                  JSON视图
                </span>
              }
              key="json"
              style={{ height: "100%", overflow: "hidden" }}
            >
              <div style={{ height: "100%", padding: "0 16px 16px" }}>
                <JsonView data={source} />
              </div>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <FilterOutlined />
                  字段列表 ({filteredFields.length})
                </span>
              }
              key="fields"
              style={{ height: "100%", overflow: "hidden" }}
            >
              <div style={{ height: "100%", padding: "0 16px 16px" }}>
                <FieldList
                  fields={filteredFields}
                  searchText={searchText}
                  onFieldSelect={() => {
                    // 处理字段选择，可以用于快速创建映射
                    // console.log("选择字段:", field); // 注释掉调试代码
                  }}
                />
              </div>
            </TabPane>
          </Tabs>
        )}
      </div>

      {/* 底部统计信息 */}
      {hasData && (
        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid #f0f0f0",
            background: "#fafafa",
            fontSize: 12,
            color: "rgba(0, 0, 0, 0.45)", // 使用 Ant Design 推荐的次要文本颜色
          }}
        >
          <Space split={<span>•</span>}>
            <span>记录: {source.length.toLocaleString()}</span>
            <span>字段: {sourceFields.length}</span>
            {pagination && (
              <span>
                页面: {pagination.currentPage}/
                {Math.ceil(pagination.totalRecords / pagination.pageSize)}
              </span>
            )}
          </Space>
        </div>
      )}
    </div>
  );
};

export default LeftPanel;
