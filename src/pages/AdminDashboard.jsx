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
        }}
      >
        <div style={{ color: "white", fontSize: "20px", fontWeight: "bold" }}>
          Painel do Administrador
        </div>
        <div style={{ color: "white" }}>
          Olá, {user.username}
          <Button
            type="link"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ color: "white", marginLeft: 16 }}
          >
            Sair
          </Button>
        </div>
      </Header>
      <Layout>
        <Sider width={200} theme="light">
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
        <Layout style={{ padding: "24px" }}>
          <Content
            style={{
              padding: 24,
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
