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
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { getTables, createTable, deleteTable } from "../services/api";

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    setLoading(true);
    try {
      const response = await getTables();
      setTables(response.data);
    } catch (error) {
      message.error("Erro ao carregar mesas");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteTable(id);
      message.success("Mesa excluída com sucesso!");
      loadTables();
    } catch (error) {
      message.error("Erro ao excluir mesa");
    }
  };

  const handleSubmit = async (values) => {
    try {
      await createTable(values);
      message.success("Mesa criada com sucesso!");
      setModalVisible(false);
      loadTables();
    } catch (error) {
      message.error("Erro ao criar mesa");
    }
  };

  const columns = [
    {
      title: "Número da Mesa",
      dataIndex: "table_number",
      key: "table_number",
    },
    {
      title: "Capacidade",
      dataIndex: "capacity",
      key: "capacity",
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => (
        <Space>
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
          Nova Mesa
        </Button>
      </div>

      <Table
        dataSource={tables}
        columns={columns}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title="Nova Mesa"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="table_number"
            label="Número da Mesa"
            rules={[{ required: true, message: "Digite o número da mesa" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="capacity"
            label="Capacidade"
            rules={[{ required: true, message: "Digite a capacidade" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TableManagement;
