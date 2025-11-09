import { useState, useEffect } from "react";
import { Layout, Menu, Button, message } from "antd";
import {
  UserOutlined,
  TableOutlined,
  LogoutOutlined,
  PictureOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import UserManagement from "../components/UserManagement";
import TableManagement from "../components/TableManagement";
import EventConfig from "../components/EventConfig";
import AllReservations from "../components/AllReservations";

const { Header, Content, Sider } = Layout;

const AdminDashboard = ({ user, onLogout }) => {
  const [selectedMenu, setSelectedMenu] = useState("users");

  const handleLogout = () => {
    localStorage.clear();
    message.success("Logout realizado com sucesso!");
    onLogout();
  };

  const renderContent = () => {
    switch (selectedMenu) {
      case "users":
        return <UserManagement />;
      case "tables":
        return <TableManagement />;
      case "event":
        return <EventConfig />;
      case "reservations":
        return <AllReservations />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          padding: "0 16px",
        }}
      >
        <div style={{ color: "white", fontSize: "18px", fontWeight: "bold" }}>
          Painel Admin
        </div>
        <div
          style={{
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              maxWidth: "150px",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user.username}
          </span>
          <Button
            type="link"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ color: "white", padding: "4px 8px" }}
          >
            <span style={{ display: "none" }}>Sair</span>
          </Button>
        </div>
      </Header>
      <Layout>
        <Sider
          width={200}
          theme="light"
          breakpoint="lg"
          collapsedWidth="0"
          style={{
            overflow: "auto",
            height: "calc(100vh - 64px)",
            position: "sticky",
            top: 64,
            left: 0,
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedMenu]}
            style={{ height: "100%", borderRight: 0 }}
            onSelect={({ key }) => setSelectedMenu(key)}
            items={[
              {
                key: "users",
                icon: <UserOutlined />,
                label: "Usuários",
              },
              {
                key: "tables",
                icon: <TableOutlined />,
                label: "Mesas",
              },
              {
                key: "event",
                icon: <PictureOutlined />,
                label: "Evento",
              },
              {
                key: "reservations",
                icon: <CalendarOutlined />,
                label: "Reservas",
              },
            ]}
          />
        </Sider>
        <Layout style={{ padding: "16px" }}>
          <Content
            style={{
              padding: 16,
              margin: 0,
              minHeight: 280,
              background: "white",
              borderRadius: 8,
            }}
          >
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AdminDashboard;
