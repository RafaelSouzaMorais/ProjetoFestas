import { useState, useEffect } from "react";
import { Table, Card, Tag, Button, Space } from "antd";
import { FilePdfOutlined } from "@ant-design/icons";
import { getAllReservations, getRelatorio } from "../services/api";

const AllReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [relatorio, setRelatorio] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const response = await getAllReservations();
      const relatorioResponse = await getRelatorio();
      setReservations(response.data);
      setRelatorio(relatorioResponse.data);
    } catch (error) {
      console.error("Erro ao carregar reservas");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = () => {
    const sortedRelatorio = [...relatorio].sort((a, b) => {
      return a.convidado.localeCompare(b.convidado, undefined, {
        numeric: false,
      });
    });
    console.log("Sorted Relatorio:", relatorio);
    let reportContent = `RELATÓRIO DE RESERVAS\n`;
    reportContent += `Gerado em: ${new Date().toLocaleString("pt-BR")}\n`;
    reportContent += `Total de Pessoas: ${sortedRelatorio.length}\n\n`;
    reportContent += `${"=".repeat(80)}\n\n`;
    console.log("Sorted Relatorio:", sortedRelatorio);
    //deixando os nomes alinhados
    const maxConvidadoLength = Math.max(
      ...sortedRelatorio.map((r) => r.convidado.length)
    );
    const maxNameLength = Math.max(
      ...sortedRelatorio.map((r) => r.name.length)
    );
    const maxUsernameLength = Math.max(
      ...sortedRelatorio.map((r) => r.username.length)
    );
    const maxIndentLength = Math.max(
      ...sortedRelatorio.map((r, i) => (i + 1).toString().length)
    );

    sortedRelatorio.forEach((reservation, index) => {
      reportContent +=
        `${index + 1}.` +
        " ".repeat(maxIndentLength - (index + 1).toString().length + 2) +
        `Convidado: ${reservation.convidado}` +
        " ".repeat(maxConvidadoLength - reservation.convidado.length + 2) +
        `Dono: ${reservation.name}` +
        " ".repeat(maxNameLength - reservation.name.length + 2) +
        `User: ${reservation.username}` +
        " ".repeat(maxUsernameLength - reservation.username.length + 2) +
        `\n`;
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
