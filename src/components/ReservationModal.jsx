import { useState, useEffect } from "react";
import { Modal, Table, Button, Tag, Popconfirm, message, Space } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  getTables,
  getReservations,
  createReservation,
  deleteReservation,
  getAllReservations,
} from "../services/api";
import { rules } from "eslint-plugin-react-refresh";

const ReservationModal = ({ visible, onClose, user }) => {
  const [tables, setTables] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [allReservations, setAllReservations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tablesRes, myReservationsRes, allReservationsRes] =
        await Promise.all([
          getTables(),
          getReservations(),
          getAllReservations(),
        ]);

      setTables(tablesRes.data);
      setMyReservations(myReservationsRes.data);
      setAllReservations(allReservationsRes.data);
    } catch (error) {
      message.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (tableId) => {
    if (myReservations.length >= user.mesa_quota) {
      message.warning(`Você atingiu o limite de ${user.mesa_quota} mesa(s)`);
      return;
    }

    try {
      console.log("Tentando reservar mesa:", tableId);
      await createReservation({ table_id: tableId, extra_chairs: 0 });
      message.success("Mesa reservada com sucesso!");
      loadData();
    } catch (error) {
      //atualiza o estado das reservas
      await loadData();
      message.info(error.message || "Erro ao reservar mesa");
    }
  };

  const handleCancelReservation = async (id) => {
    try {
      await deleteReservation(id);
      message.success("Reserva cancelada com sucesso!");
      loadData();
    } catch (error) {
      message.error("Erro ao cancelar reserva");
    }
  };

  const isTableReserved = (tableId) => {
    return allReservations.some((r) => r.table_id === tableId);
  };

  const isMyReservation = (tableId) => {
    return myReservations.some((r) => r.table_id === tableId);
  };

  const availableTablesColumns = [
    {
      title: "Mesa",
      dataIndex: "table_number",
      key: "table_number",
      render: (text) => <Tag color="blue">{text}</Tag>,
      rules: { required: true },
      filter: (value, record) =>
        record.table_number
          .toString()
          .toLowerCase()
          .includes(value.toLowerCase()),
    },
    {
      title: "Capacidade",
      dataIndex: "capacity",
      key: "capacity",
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        if (isMyReservation(record.id)) {
          return <Tag color="green">Sua Reserva</Tag>;
        }
        if (isTableReserved(record.id)) {
          return <Tag color="red">Reservada</Tag>;
        }
        return <Tag color="default">Disponível</Tag>;
      },
      filters: [
        { text: "Disponível", value: "available" },
        { text: "Reservada", value: "reserved" },
        { text: "Sua Reserva", value: "my_reservation" },
      ],
      onFilter: (value, record) => {
        if (value === "available") return !isTableReserved(record.id);
        if (value === "reserved")
          return isTableReserved(record.id) && !isMyReservation(record.id);
        if (value === "my_reservation") return isMyReservation(record.id);
        return false;
      },
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => {
        if (isMyReservation(record.id)) {
          const reservation = myReservations.find(
            (r) => r.table_id === record.id
          );
          return (
            <Popconfirm
              title="Deseja cancelar esta reserva?"
              onConfirm={() => handleCancelReservation(reservation.id)}
              okText="Sim"
              cancelText="Não"
            >
              <Button
                type="primary"
                danger
                size="small"
                icon={<DeleteOutlined />}
              >
                Cancelar
              </Button>
            </Popconfirm>
          );
        }
        if (isTableReserved(record.id)) {
          return (
            <Button size="small" disabled>
              Indisponível
            </Button>
          );
        }
        return (
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => handleReserve(record.id)}
            disabled={myReservations.length >= user.mesa_quota}
          >
            Reservar
          </Button>
        );
      },
    },
  ];

  return (
    <Modal
      title="Gerenciar Reservas"
      open={visible}
      onCancel={onClose}
      footer={null}
      width="100%"
      style={{ maxWidth: 800, top: 20 }}
    >
      <div style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Tag color="blue">
            Mesas: {myReservations.length}/{user.mesa_quota}
          </Tag>
          <Tag color="orange">Cadeiras extra: {user.cadeira_extra_quota}</Tag>
        </Space>
      </div>

      <Table
        dataSource={tables}
        columns={availableTablesColumns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
      />
    </Modal>
  );
};

export default ReservationModal;
