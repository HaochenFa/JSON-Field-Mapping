import React, { useEffect } from "react";
import { notification } from "antd";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { removeNotification } from "../store/slices/uiSlice";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

const NotificationContainer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications } = useSelector((state: RootState) => state.ui);

  useEffect(() => {
    // 处理新的通知
    notifications.forEach((notif) => {
      // 为每个通知创建配置
      const config = {
        message: notif.title,
        description: notif.message,
        duration: notif.duration || 4.5,
        placement: "topRight" as const,
        onClose: () => {
          dispatch(removeNotification(notif.id));
        },
      };

      switch (notif.type) {
        case "success":
          notification.success({
            ...config,
            icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
          });
          break;
        case "error":
          notification.error({
            ...config,
            icon: <CloseCircleOutlined style={{ color: "#ff4d4f" }} />,
            duration: notif.duration || 6, // 错误通知显示更久
          });
          break;
        case "warning":
          notification.warning({
            ...config,
            icon: <ExclamationCircleOutlined style={{ color: "#faad14" }} />,
          });
          break;
        case "info":
        default:
          notification.info({
            ...config,
            icon: <InfoCircleOutlined style={{ color: "#1890ff" }} />,
          });
          break;
      }

      // 通知已显示，从状态中移除
      dispatch(removeNotification(notif.id));
    });
  }, [notifications, dispatch]);

  // 这个组件不渲染任何内容，只是处理通知逻辑
  return null;
};

export default NotificationContainer;
