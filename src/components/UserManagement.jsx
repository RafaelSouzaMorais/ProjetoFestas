import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  Popconfirm,
  message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { getUsers, createUser, updateUser, deleteUser } from "../services/api";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      setUsers(response.data.filter((u) => !u.is_admin));
    } catch (error) {
      message.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      message.success("Usuário excluído com sucesso!");
      loadUsers();
    } catch (error) {
      message.error("Erro ao excluir usuário");
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, values);
        message.success("Usuário atualizado com sucesso!");
      } else {
        await createUser(values);
        message.success("Usuário criado com sucesso!");
      }
      setModalVisible(false);
      loadUsers();
    } catch (error) {
      message.error("Erro ao salvar usuário");
    }
  };

  const columns = [
    {
      title: "Usuário",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Cota de Mesas",
      dataIndex: "mesa_quota",
      key: "mesa_quota",
    },
    {
      title: "Cadeiras Extra",
      dataIndex: "cadeira_extra_quota",
      key: "cadeira_extra_quota",
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Editar
          </Button>
          <Popconfirm
            title="Tem certeza que deseja excluir?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sim"
            cancelText="Não"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Excluir
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Novo Usuário
        </Button>
      </div>

      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingUser ? "Editar Usuário" : "Novo Usuário"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="username"
            label="Usuário"
            rules={[{ required: true, message: "Digite o nome de usuário" }]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>

          <Form.Item
            name="password"
            label="Senha"
            rules={[{ required: !editingUser, message: "Digite a senha" }]}
          >
            <Input.Password
              placeholder={editingUser ? "Deixe em branco para manter" : ""}
            />
          </Form.Item>

          <Form.Item
            name="mesa_quota"
            label="Quantidade de Mesas"
            rules={[
              { required: true, message: "Digite a quantidade de mesas" },
            ]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="cadeira_extra_quota"
            label="Cadeiras Extra"
            rules={[
              {
                required: true,
                message: "Digite a quantidade de cadeiras extra",
              },
            ]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
