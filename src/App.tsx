import { Layout, ConfigProvider } from "antd";
import { useSelector } from "react-redux";
import { RootState } from "./store";
import Header from "./components/Header";
import MainContent from "./components/MainContent";
import Footer from "./components/Footer";
import NotificationContainer from "./components/NotificationContainer";
import ConfigModals from "./components/ConfigModals";
import "./styles/index.css";

const { Header: AntHeader, Content, Footer: AntFooter } = Layout;

function App() {
  const {} = useSelector((state: RootState) => state.ui);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1890ff",
          borderRadius: 6,
        },
      }}
    >
      <Layout className="app-container">
        <AntHeader className="app-header" style={{ height: "auto", minHeight: 64 }}>
          <Header />
        </AntHeader>

        <Content className="app-content">
          <MainContent />
        </Content>

        <AntFooter className="app-footer">
          <Footer />
        </AntFooter>

        <NotificationContainer />
        <ConfigModals />
      </Layout>
    </ConfigProvider>
  );
}

export default App;
