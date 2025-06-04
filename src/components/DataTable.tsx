import React, { useState, useMemo } from "react";
import { Table, Typography, Space, Button, Tooltip, Tag, Input, Select, Pagination } from "antd";
import { FilterOutlined, ExpandOutlined, CompressOutlined, CopyOutlined } from "@ant-design/icons";
import { ColumnsType } from "antd/es/table";
import { PaginationInfo } from "../types";
import { copyToClipboard } from "../utils/helpers";
import { getValueByPath } from "../utils/fieldParser";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store";
import { showSuccessNotification } from "../store/slices/uiSlice";

const { Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface DataTableProps {
  data: any[];
  loading?: boolean;
  pagination?: PaginationInfo;
  onPageChange?: (page: number, pageSize: number) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  loading = false,
  pagination,
  onPageChange,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);

  // 生成表格列
  const columns = useMemo(() => {
    if (data.length === 0) return [];

    // 获取所有可能的列
    const allKeys = new Set<string>();
    data.forEach((item) => {
      const flattenKeys = (obj: any, prefix = "") => {
        Object.keys(obj).forEach((key) => {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          allKeys.add(fullKey);

          if (obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
            flattenKeys(obj[key], fullKey);
          }
        });
      };
      flattenKeys(item);
    });

    const keyArray = Array.from(allKeys).slice(0, 20); // 限制列数

    const tableColumns: ColumnsType<any> = keyArray.map((key) => ({
      title: (
        <Space>
          <Text strong style={{ fontSize: 12 }}>
            {key}
          </Text>
          <Tooltip title="复制列名">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                copyToClipboard(key);
                dispatch(
                  showSuccessNotification({
                    title: "复制成功",
                    message: "列名已复制到剪贴板",
                  })
                );
              }}
              style={{ padding: 0, height: 16, width: 16 }}
            />
          </Tooltip>
        </Space>
      ),
      dataIndex: key,
      key,
      width: 150,
      ellipsis: {
        showTitle: false,
      },
      render: (record: any) => {
        const actualValue = getValueByPath(record, key);

        if (actualValue === null || actualValue === undefined) {
          return <Text type="secondary">null</Text>;
        }

        if (typeof actualValue === "boolean") {
          return <Tag color={actualValue ? "green" : "red"}>{actualValue.toString()}</Tag>;
        }

        if (typeof actualValue === "number") {
          return (
            <Text code style={{ color: "#1890ff" }}>
              {actualValue.toLocaleString()}
            </Text>
          );
        }

        if (typeof actualValue === "object") {
          const jsonStr = JSON.stringify(actualValue);
          return (
            <Tooltip title={jsonStr}>
              <Text
                ellipsis
                style={{ maxWidth: 120, cursor: "pointer" }}
                onClick={() => {
                  copyToClipboard(jsonStr);
                  dispatch(
                    showSuccessNotification({
                      title: "复制成功",
                      message: "JSON已复制到剪贴板",
                    })
                  );
                }}
              >
                {Array.isArray(actualValue) ? `[${actualValue.length}]` : "{...}"}
              </Text>
            </Tooltip>
          );
        }

        const strValue = String(actualValue);
        return (
          <Tooltip title={strValue}>
            <Text
              ellipsis
              style={{ maxWidth: 120, cursor: "pointer" }}
              onClick={() => {
                copyToClipboard(strValue);
                dispatch(
                  showSuccessNotification({
                    title: "复制成功",
                    message: "内容已复制到剪贴板",
                  })
                );
              }}
            >
              {strValue}
            </Text>
          </Tooltip>
        );
      },
      sorter: (a: any, b: any) => {
        const aVal = getValueByPath(a, key);
        const bVal = getValueByPath(b, key);

        if (aVal === null || aVal === undefined) return -1;
        if (bVal === null || bVal === undefined) return 1;

        if (typeof aVal === "number" && typeof bVal === "number") {
          return aVal - bVal;
        }

        return String(aVal).localeCompare(String(bVal));
      },
      filterable: true,
    }));

    return tableColumns;
  }, [data]);

  // 过滤数据
  const filteredData = useMemo(() => {
    if (!searchText && filterColumn === "all") {
      return data;
    }

    return data.filter((item) => {
      // 搜索过滤
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const itemStr = JSON.stringify(item).toLowerCase();
        if (!itemStr.includes(searchLower)) {
          return false;
        }
      }

      // 列过滤
      if (filterColumn !== "all") {
        const columnValue = getValueByPath(item, filterColumn);
        if (columnValue === null || columnValue === undefined) {
          return false;
        }
      }

      return true;
    });
  }, [data, searchText, filterColumn]);

  // 处理展开/收起所有行
  const handleExpandAll = () => {
    if (expandedRows.length > 0) {
      setExpandedRows([]);
    } else {
      setExpandedRows(filteredData.map((_, index) => index.toString()));
    }
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // 处理列过滤
  const handleColumnFilter = (value: string) => {
    setFilterColumn(value);
  };

  // 处理分页变化
  const handlePageChange = (page: number, size: number) => {
    setPageSize(size);
    onPageChange?.(page, size);
  };

  // 获取列名列表用于过滤
  const columnNames = columns.map((col) => col.key as string);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* 工具栏 */}
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Search
            placeholder="搜索数据内容"
            allowClear
            size="small"
            style={{ width: 200 }}
            onSearch={handleSearch}
            onChange={(e) => !e.target.value && setSearchText("")}
          />

          <Select
            size="small"
            style={{ width: 120 }}
            placeholder="过滤列"
            allowClear
            value={filterColumn === "all" ? undefined : filterColumn}
            onChange={handleColumnFilter}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">所有列</Option>
            {columnNames.map((name) => (
              <Option key={name} value={name}>
                {name}
              </Option>
            ))}
          </Select>

          <Tooltip title={expandedRows.length > 0 ? "收起所有行" : "展开所有行"}>
            <Button
              size="small"
              icon={expandedRows.length > 0 ? <CompressOutlined /> : <ExpandOutlined />}
              onClick={handleExpandAll}
            >
              {expandedRows.length > 0 ? "收起" : "展开"}
            </Button>
          </Tooltip>

          <Text type="secondary" style={{ fontSize: 12 }}>
            共 {filteredData.length} 条记录
          </Text>
        </Space>
      </div>

      {/* 表格 */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          size="small"
          scroll={{ x: "max-content", y: "calc(100vh - 400px)" }}
          pagination={false}
          rowKey={(index) => index?.toString() || "0"}
          expandable={{
            expandedRowKeys: expandedRows,
            onExpand: (expanded, record) => {
              // 查找记录在filteredData中的索引
              const recordIndex = filteredData.findIndex((item) => item === record);
              const recordKey = recordIndex.toString();

              if (expanded) {
                setExpandedRows([...expandedRows, recordKey]);
              } else {
                setExpandedRows(expandedRows.filter((key) => key !== recordKey));
              }
            },
            expandedRowRender: (record) => (
              <div style={{ padding: 16, background: "#fafafa" }}>
                <pre style={{ margin: 0, fontSize: 12, maxHeight: 200, overflow: "auto" }}>
                  {JSON.stringify(record, null, 2)}
                </pre>
              </div>
            ),
            rowExpandable: () => true,
          }}
          locale={{
            emptyText: "暂无数据",
          }}
        />
      </div>

      {/* 分页 */}
      {pagination && (
        <div style={{ marginTop: 16, textAlign: "right" }}>
          <Pagination
            current={pagination.currentPage}
            total={pagination.totalRecords}
            pageSize={pageSize}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
            pageSizeOptions={["10", "20", "50", "100"]}
            onChange={handlePageChange}
            size="small"
          />
        </div>
      )}
    </div>
  );
};

export default DataTable;
