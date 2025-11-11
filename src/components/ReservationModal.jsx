import { useState, useEffect } from "react";
import {
  Modal,
  Table,
  Button,
  Tag,
  Popconfirm,
  message,
  Space,
  Input,
  Select,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  getTables,
  getReservations,
  createReservation,
  deleteReservation,
  getAllReservations,
} from "../services/api";

// Configurar z-index alto para as mensagens aparecerem na frente dos modais
message.config({
  top: 100,
  maxCount: 3,
  duration: 4,
  getContainer: () => document.body,
});

const ReservationModal = ({ visible, onClose, user }) => {
  const [tables, setTables] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [allReservations, setAllReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [filterMesa, setFilterMesa] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

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
      const errMsg = error.response?.data?.error || "Erro ao cancelar reserva";

      // Mostrar em um modal customizado controlado por estado
      setErrorMessage(errMsg);
      setErrorModalVisible(true);
    }
  };

  const isTableReserved = (tableId) => {
    return allReservations.some((r) => r.table_id === tableId);
  };

  const isMyReservation = (tableId) => {
    return myReservations.some((r) => r.table_id === tableId);
  };

  // Filtrar tabelas
  const filteredTables = tables.filter((table) => {
    // Filtro por mesa
    const matchMesa = filterMesa
      ? table.table_number
          .toString()
          .toLowerCase()
          .includes(filterMesa.toLowerCase())
      : true;

    // Filtro por status
    let matchStatus = true;
    if (filterStatus === "available") {
      matchStatus = !isTableReserved(table.id);
    } else if (filterStatus === "reserved") {
      matchStatus = isTableReserved(table.id) && !isMyReservation(table.id);
    } else if (filterStatus === "my_reservation") {
      matchStatus = isMyReservation(table.id);
    }

    return matchMesa && matchStatus;
  });

  const availableTablesColumns = [
    {
      title: "Mesa",
      dataIndex: "name",
      key: "name",
      render: (text) => <Tag color="blue">{text}</Tag>,
      sorter: (a, b) => {
        const numA = parseInt(a.name) || 0;
        const numB = parseInt(b.name) || 0;
        return numA - numB;
      },
      filterSearch: true,
      onFilter: (value, record) =>
        record.name.toString().toLowerCase().includes(value.toLowerCase()),
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
    <>
      <Modal
        title="Não é possível excluir a reserva"
        open={errorModalVisible}
        onOk={() => setErrorModalVisible(false)}
        onCancel={() => setErrorModalVisible(false)}
        okText="Entendi"
        cancelButtonProps={{ style: { display: "none" } }}
        centered
        zIndex={2000}
      >
        <p>{errorMessage}</p>
      </Modal>

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

        <div style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            <Input
              placeholder="Filtrar por mesa"
              value={filterMesa}
              onChange={(e) => setFilterMesa(e.target.value)}
              allowClear
              style={{ width: "100%" }}
            />
            <Select
              placeholder="Filtrar por status"
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: "100%" }}
              options={[
                { label: "Todos", value: "all" },
                { label: "Disponível", value: "available" },
                { label: "Reservada", value: "reserved" },
                { label: "Minha Reserva", value: "my_reservation" },
              ]}
            />
          </Space>
        </div>

        <Table
          dataSource={filteredTables}
          columns={availableTablesColumns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />
      </Modal>
    </>
  );
};

export default ReservationModal;
