import { useState, useEffect } from "react";
import { Card, Table, Button, Input, message, Space, Tag } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  getReservations,
  getChairsReservations,
  addGuest,
  removeGuest,
  getGuests,
} from "../services/api";

const GuestManager = () => {
  const [reservations, setReservations] = useState([]);
  const [guests, setGuests] = useState([]);
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resRes, chairsRes, guestsRes] = await Promise.all([
        getReservations(),
        getChairsReservations(),
        getGuests(),
      ]);
      console.log("Reservations Response:", resRes);
      console.log("Chairs Response:", chairsRes);
      console.log("Guests Response:", guestsRes);

      setReservations(Array.isArray(resRes.data) ? resRes.data : []);
      setTotalCapacity(chairsRes.data?.total_chairs || 0);
      setGuests(Array.isArray(guestsRes.data) ? guestsRes.data : []);
    } catch (error) {
      console.error("Error loading data:", error);
      console.error("Error details:", error.response);
      message.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = async () => {
    if (!guestName.trim()) {
      message.warning("Digite o nome do convidado");
      return;
    }

    if (guests.length >= totalCapacity) {
      message.warning("Limite de convidados atingido!");
      return;
    }

    try {
      await addGuest(guestName);
      setGuestName("");
      loadData();
      message.success("Convidado adicionado!");
    } catch {
      message.error("Erro ao adicionar convidado");
    }
  };

  const handleRemoveGuest = async (guestId) => {
    try {
      await removeGuest(guestId);
      loadData();
      message.success("Convidado removido!");
    } catch {
      message.error("Erro ao remover convidado");
    }
  };

  return (
    <Card title="Gerenciar Convidados">
      {0 === totalCapacity ? (
        <p>Nenhuma reserva encontrada. Faça uma reserva primeiro.</p>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>Suas Reservas:</strong>
            </div>
            {reservations.map((r) => (
              <Tag key={r.id} color="blue" style={{ marginBottom: 4 }}>
                Mesa {r.table_number}: {r.capacity + r.extra_chairs} lugares
              </Tag>
            ))}
            <div style={{ marginTop: 8 }}>
              <Tag
                color={guests.length >= totalCapacity ? "red" : "green"}
                style={{ fontSize: 14 }}
              >
                Total de vagas: {guests.length} / {totalCapacity}
              </Tag>
            </div>
          </div>

          <Space
            direction={isMobile ? "vertical" : "horizontal"}
            style={{ width: "100%", marginBottom: 16 }}
          >
            <Input
              placeholder="Nome do convidado"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onPressEnter={handleAddGuest}
              style={{ width: isMobile ? "100%" : 240 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddGuest}
              disabled={guests.length >= totalCapacity}
              style={{ width: isMobile ? "100%" : "auto" }}
            >
              Adicionar Convidado
            </Button>
          </Space>

          <Table
            dataSource={guests}
            columns={[
              {
                title: "Nome",
                dataIndex: "name",
                key: "name",
                render: (text, record, index) => `${index + 1}. ${text}`,
              },
              {
                title: "Ações",
                key: "actions",
                width: isMobile ? 80 : 120,
                render: (_, record) => (
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveGuest(record.id)}
                  >
                    {isMobile ? "" : "Remover"}
                  </Button>
                ),
              },
            ]}
            rowKey="id"
            pagination={false}
            loading={loading}
            locale={{ emptyText: "Nenhum convidado adicionado" }}
            scroll={{ x: true }}
          />
        </>
      )}
    </Card>
  );
};

export default GuestManager;
