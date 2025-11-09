import { useState, useEffect } from "react";
import { Table, Card, Tag } from "antd";
import { getAllReservations } from "../services/api";

const AllReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const response = await getAllReservations();
      setReservations(response.data);
    } catch (error) {
      console.error("Erro ao carregar reservas");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Usuário",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Mesa",
      dataIndex: "table_number",
      key: "table_number",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Capacidade",
      dataIndex: "capacity",
      key: "capacity",
    },
    {
      title: "Cadeiras Extra",
      dataIndex: "extra_chairs",
      key: "extra_chairs",
    },
  ];

  return (
    <Card title="Todas as Reservas">
      <Table
        dataSource={reservations}
        columns={columns}
        rowKey="id"
        loading={loading}
      />
    </Card>
  );
};

export default AllReservations;
