import React, { useEffect, useRef, useState } from "react";
import { message, Spin } from "antd";
import api from "../services/api";

const DEFAULT_IMAGE = "";

function UserTableMap() {
  const [image, setImage] = useState(DEFAULT_IMAGE);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState([]);
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [user, setUser] = useState(null);
  const [markerSize, setMarkerSize] = useState(32);
  const [guestCount, setGuestCount] = useState(0);
  const imgRef = useRef();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Carrega usuário
      const meRes = await api.get("/me");
      setUser(meRes.data);

      // Carrega imagem
      const imgRes = await api.get("/event-config");
      setImage(imgRes.data?.event_image || DEFAULT_IMAGE);

      // Carrega marcadores
      const markersRes = await api.get("/table-map");
      const data = markersRes.data || { markers: [], markerSize: 32 };
      // Compatibilidade com formato antigo
      const loadedMarkers = Array.isArray(data) ? data : data.markers || [];
      const loadedSize = Array.isArray(data) ? 32 : data.markerSize || 32;
      setMarkers(loadedMarkers);
      setMarkerSize(loadedSize);

      // Carrega mesas
      const tablesRes = await api.get("/tables");
      setTables(tablesRes.data || []);

      // Carrega TODAS as reservas para saber quais mesas já estão ocupadas
      const reservationsRes = await api.get("/reservations/all");
      setReservations(reservationsRes.data || []);

      // Identifica minhas reservas
      const myReservs = reservationsRes.data.filter(
        (r) => r.user_id === meRes.data.id
      );
      setMyReservations(myReservs);

      // Carrega quantidade de convidados
      try {
        const guestsRes = await api.get("/guests");
        setGuestCount(guestsRes.data?.length || 0);
      } catch (err) {
        console.error("Erro ao carregar convidados:", err);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      message.error("Erro ao carregar mapa");
    } finally {
      setLoading(false);
    }
  }

  // Determina a cor do marcador
  function getMarkerColor(marker) {
    const table = tables.find((t) => t.id === marker.table_id);
    if (!table) return "#999"; // Cinza se não encontrar a mesa

    // Verifica se EU reservei
    const myReserv = myReservations.find((r) => r.table_id === table.id);
    if (myReserv) return "#52c41a"; // Verde - minha reserva

    // Verifica se alguém reservou
    const reserved = reservations.find((r) => r.table_id === table.id);
    if (reserved) return "#ff4d4f"; // Vermelho - reservado

    return "#1890ff"; // Azul - disponível
  }

  // Clique no marcador - reserva ou cancela
  async function handleMarkerClick(marker) {
    console.log("Clique no marcador:", marker);
    const table = tables.find((t) => t.id === marker.table_id);
    console.log("Mesa encontrada:", table);

    if (!table) {
      message.warning("Mesa não encontrada");
      return;
    }

    // Verifica se EU já reservei esta mesa
    const myReserv = myReservations.find((r) => r.table_id === table.id);
    console.log("Minha reserva:", myReserv);

    if (myReserv) {
      // Cancelar reserva
      console.log("Tentando cancelar reserva:", myReserv.id);
      try {
        const response = await api.delete(`/reservations/${myReserv.id}`);
        console.log("Resposta do cancelamento:", response);
        const label = marker.table_number || table.name || table.id;
        message.success(`Mesa ${label} liberada!`);
        await loadData();
      } catch (err) {
        console.error("Erro completo ao cancelar:", err);
        console.error("Resposta do erro:", err.response);
        console.error("Dados do erro:", err.response?.data);

        // Extrai a mensagem de erro
        let errorMsg = "Erro ao cancelar reserva";

        if (err.response && err.response.data && err.response.data.error) {
          errorMsg = err.response.data.error;
        }

        console.log("Mostrando mensagem de erro:", errorMsg);

        // Mostra a mensagem na tela
        message.error(errorMsg, 12);
      }
      return;
    }

    // Verifica se a mesa está disponível
    const reserved = reservations.find((r) => r.table_id === table.id);
    console.log("Mesa reservada por outro:", reserved);

    if (reserved) {
      message.warning("Esta mesa já está reservada por outra pessoa");
      return;
    }

    // Verifica se o usuário atingiu a quota
    console.log(
      "Minhas reservas:",
      myReservations.length,
      "Quota:",
      user?.mesa_quota
    );

    if (myReservations.length >= user.mesa_quota) {
      message.warning(
        `Você já atingiu seu limite de ${user.mesa_quota} mesa(s)`
      );
      return;
    }

    // Reservar mesa
    console.log("Tentando reservar mesa:", table.id);
    try {
      const response = await api.post("/reservations", {
        table_id: table.id,
        guest_name: "",
        extra_chairs: 0,
      });
      console.log("Resposta da reserva:", response);
      const label = marker.table_number || table.name || table.id;
      message.success(`Mesa ${label} reservada!`);
      await loadData();
    } catch (err) {
      console.error("Erro ao reservar:", err);
      const errorMsg = err.response?.data?.error || "Erro ao reservar mesa";
      message.error(errorMsg, 5);
    }
  }

  // Renderiza marcador
  function renderMarker(marker) {
    const color = getMarkerColor(marker);
    const table = tables.find((t) => t.id === marker.table_id);
    const badgeSize = Math.max(14, Math.round(markerSize * 0.6));
    const badgeOffset = Math.round(markerSize * 0.4);

    return (
      <div
        key={marker.id}
        className="marker"
        style={{
          position: "absolute",
          left: `${marker.x}%`,
          top: `${marker.y}%`,
          transform: "translate(-50%, -50%)",
          width: markerSize,
          height: markerSize,
          borderRadius: markerSize / 2,
          border: "2px solid #fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
          background: color,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: Math.max(10, Math.round(markerSize * 0.45)),
          fontWeight: 600,
          cursor: "pointer",
          pointerEvents: "auto",
          userSelect: "none",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        title={`Mesa ${marker.table_number || marker.id} — ${
          marker.chairs
        } cadeira(s)`}
        onClick={(e) => {
          console.log("onClick disparado!", e);
          handleMarkerClick(marker);
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)";
          e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.4)";
        }}
      >
        {marker.table_number || marker.id}
        {/* badge de cadeiras */}
        <div
          style={{
            position: "absolute",
            right: -badgeOffset,
            bottom: -badgeOffset,
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            background: "#fff",
            color: color,
            fontSize: Math.max(9, Math.round(markerSize * 0.35)),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `2px solid ${color}`,
            fontWeight: 700,
          }}
        >
          {marker.chairs}
        </div>
      </div>
    );
  }

  return (
    <div className="user-table-map">
      <h2>Mapa de Mesas</h2>
      {user && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: "#666", marginBottom: 4 }}>
            Você reservou <strong>{myReservations.length}</strong> de{" "}
            <strong>{user.mesa_quota}</strong> mesa(s) disponíveis
          </p>
          <p style={{ color: "#666", marginBottom: 8, fontSize: "13px" }}>
            Convidados cadastrados: <strong>{guestCount}</strong>
            {guestCount > 0 && (
              <span style={{ color: "#ff4d4f", marginLeft: 8 }}>
                (Para cancelar reservas, você pode precisar excluir alguns
                convidados)
              </span>
            )}
          </p>
        </div>
      )}
      <div
        style={{ marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              background: "#1890ff",
              border: "2px solid #fff",
            }}
          />
          <span>Disponível (clique para reservar)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              background: "#ff4d4f",
              border: "2px solid #fff",
            }}
          />
          <span>Reservado por outro</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              background: "#52c41a",
              border: "2px solid #fff",
            }}
          />
          <span>Sua reserva (clique para cancelar)</span>
        </div>
      </div>
      <div
        className="image-wrap"
        style={{ position: "relative", maxWidth: 900 }}
      >
        {loading ? (
          <Spin />
        ) : image ? (
          <img
            ref={imgRef}
            src={image}
            alt="Mapa do evento"
            style={{ width: "100%", height: "auto" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: 400,
              background: "#f5f5f5",
              border: "1px solid #ddd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#999" }}>Sem imagem do evento</span>
          </div>
        )}
        <div
          className="overlay"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          {markers.map(renderMarker)}
        </div>
      </div>
    </div>
  );
}

export default UserTableMap;
