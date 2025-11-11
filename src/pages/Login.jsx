import { useState } from "react";
import { Form, Input, Button, Card, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { login } from "../services/api";

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      console.log("[Login] Enviando credenciais", values.username);
      const response = await login(values.username, values.password);
      console.log("[Login] Resposta da API", response.data);
      if (!response.data?.user) {
        message.error("Resposta inesperada do servidor");
      } else {
        localStorage.setItem("token", response.data.token);
        message.success("Login realizado com sucesso!");
        onLogin(response.data.user);
      }
    } catch (error) {
      console.error("[Login] Erro na requisição", error);
      if (error.response) {
        message.error(error.response.data?.error || "Credenciais inválidas");
      } else {
        message.error("Falha de conexão com o servidor");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "16px",
      }}
    >
      <Card
        title="Sistema de Reservas - Festa"
        style={{
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <Form name="login" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Digite seu usuário!" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Usuário" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Digite sua senha!" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Senha" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Entrar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
