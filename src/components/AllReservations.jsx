import { useState, useEffect } from "react";
import { Table, Card, Tag, Button, Space } from "antd";
import { FilePdfOutlined } from "@ant-design/icons";
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

  const generateReport = () => {
    const sortedReservations = [...reservations].sort((a, b) => {
      return a.table_number.localeCompare(b.table_number, undefined, {
        numeric: true,
      });
    });

    let reportContent = `RELATÓRIO DE RESERVAS\n`;
    reportContent += `Gerado em: ${new Date().toLocaleString("pt-BR")}\n`;
    reportContent += `Total de Reservas: ${sortedReservations.length}\n\n`;
    reportContent += `${"=".repeat(80)}\n\n`;

    sortedReservations.forEach((reservation, index) => {
      reportContent += `${index + 1}. Mesa: ${reservation.table_number}\n`;
      reportContent += `   Usuário: ${reservation.username}\n`;
      reportContent += `   Capacidade: ${reservation.capacity} pessoas\n`;
      reportContent += `   Cadeiras Extra: ${reservation.extra_chairs}\n`;
      reportContent += `   ${"-".repeat(76)}\n\n`;
    });

    const blob = new Blob([reportContent], {
      type: "text/plain;charset=utf-8",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-reservas-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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
    <Card
      title="Todas as Reservas"
      extra={
        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          onClick={generateReport}
          disabled={reservations.length === 0}
        >
          Gerar Relatório
        </Button>
      }
    >
      <Table
        dataSource={reservations}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: true }}
      />
    </Card>
  );
};

export default AllReservations;
