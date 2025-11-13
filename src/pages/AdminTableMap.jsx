import React, { useEffect, useRef, useState } from "react";
import { Button, InputNumber, Modal, message, Spin, Slider } from "antd";
import api from "../services/api";

const DEFAULT_IMAGE = ""; // quadro branco

function AdminTableMap() {
  const [image, setImage] = useState(DEFAULT_IMAGE);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState([]); // {id, x, y, chairs, table_id, table_number}
  const [reservedTableIds, setReservedTableIds] = useState(new Set());
  const [addMode, setAddMode] = useState(true);
  const [nextId, setNextId] = useState(1);
  const [modal, setModal] = useState({ visible: false, marker: null });
  const [markerSize, setMarkerSize] = useState(24);
  const draggingRef = useRef({ active: false, id: null });
  const overlayRef = useRef();
  const imgRef = useRef();

  // Salva o tamanho do marcador no backend quando mudar
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await api.put("/table-map-config", { markerSize });
      } catch (err) {
        console.error("Erro ao salvar tamanho:", err);
      }
    }, 500); // Debounce de 500ms
    return () => clearTimeout(timer);
  }, [markerSize]);

  // Carrega imagem e mesas do backend
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const imgRes = await api.get("/event-config");
        setImage(imgRes.data?.event_image || DEFAULT_IMAGE);
        const tablesRes = await api.get("/table-map");
        const data = tablesRes.data || { markers: [], markerSize: 24 };
        // Compatibilidade com formato antigo
        const loadedMarkers = Array.isArray(data) ? data : data.markers || [];
        const loadedSize = Array.isArray(data) ? 24 : data.markerSize || 24;
        setMarkers(loadedMarkers);
        setMarkerSize(loadedSize);
        const maxId = loadedMarkers.length
          ? Math.max(...loadedMarkers.map((m) => m.id || 0))
          : 0;
        setNextId(maxId + 1);

        // Carrega TODAS as reservas para indicar mesas ocupadas
        try {
          const reservationsRes = await api.get("/reservations/all");
          const setIds = new Set(
            (reservationsRes.data || [])
              .filter((r) => r && typeof r.table_id === "number")
              .map((r) => r.table_id)
          );
          setReservedTableIds(setIds);
        } catch (resErr) {
          console.error("Erro ao carregar reservas:", resErr);
          setReservedTableIds(new Set());
        }
      } catch (err) {
        setImage(DEFAULT_IMAGE);
        setMarkers([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Adiciona marcador
  function addMarker(x, y) {
    setModal({ visible: true, marker: { id: nextId, x, y, chairs: 1 } });
  }

  // Salva novo marcador
  async function saveMarker(marker) {
    try {
      const { data } = await api.post("/table-map", marker);
      setMarkers((prev) => [...prev, data]);
      setNextId((id) => id + 1);
      setModal({ visible: false, marker: null });
      message.success("Mesa adicionada!");
    } catch (err) {
      message.error("Erro ao salvar mesa");
    }
  }

  // Remove marcador (se não houver reserva)
  async function removeMarker(marker) {
    try {
      await api.delete(`/table-map/${marker.id}`);
      setMarkers((prev) => prev.filter((m) => m.id !== marker.id));
      message.success("Mesa removida!");
    } catch (err) {
      message.error("Não é possível remover mesa com reserva");
    }
  }

  // Atualiza posição e/ou cadeiras do marcador
  async function updateMarker(partial) {
    const { id, x, y, chairs } = partial;
    try {
      console.log("Enviando atualização:", { id, x, y, chairs });
      await api.put(`/table-map/${id}`, { x, y, chairs });
      console.log("Atualização salva com sucesso!");
      // Não sobrescreve com a resposta do servidor, mantém o estado local
      // que já foi atualizado durante o arrasto
    } catch (err) {
      console.error(err);
      message.error("Erro ao atualizar mesa");
      // Em caso de erro, recarrega os dados do servidor
      try {
        const tablesRes = await api.get("/table-map");
        setMarkers(tablesRes.data || []);
      } catch (reloadErr) {
        console.error("Erro ao recarregar mesas:", reloadErr);
      }
    }
  }

  // Clique na imagem para adicionar mesa
  function handleImageClick(e) {
    if (!addMode) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    addMarker(x, y);
  }

  // Renderiza marcador
  function renderMarker(marker) {
    const onMouseDown = (e) => {
      e.stopPropagation();
      e.preventDefault();

      // Variável local para rastrear o arrasto
      let dragStart = { x: e.clientX, y: e.clientY, moved: false };
      let finalPosition = { x: marker.x, y: marker.y }; // Armazena posição final
      draggingRef.current = { active: true, id: marker.id };
      const startRect = imgRef.current?.getBoundingClientRect();

      const onMove = (evt) => {
        if (!draggingRef.current.active) return;
        if (!startRect) return;

        // Detecta movimento significativo (mais de 3px)
        const deltaX = Math.abs(evt.clientX - dragStart.x);
        const deltaY = Math.abs(evt.clientY - dragStart.y);
        if (deltaX > 3 || deltaY > 3) {
          dragStart.moved = true;
        }

        const x = evt.clientX - startRect.left;
        const y = evt.clientY - startRect.top;
        const xPct = Math.max(0, Math.min(100, (x / startRect.width) * 100));
        const yPct = Math.max(0, Math.min(100, (y / startRect.height) * 100));

        // Armazena a posição final
        finalPosition = { x: xPct, y: yPct };

        setMarkers((prev) =>
          prev.map((m) => (m.id === marker.id ? { ...m, x: xPct, y: yPct } : m))
        );
      };

      const onUp = async () => {
        if (draggingRef.current.active) {
          // Se houve movimento, salva a posição
          if (dragStart.moved) {
            await updateMarker({
              id: marker.id,
              x: finalPosition.x,
              y: finalPosition.y,
            });
          } else {
            // Se não houve movimento, abre o modal
            setModal({ visible: true, marker: { ...marker } });
          }
        }
        draggingRef.current = { active: false, id: null };
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    };

    const badgeSize = Math.max(14, Math.round(markerSize * 0.6));
    const badgeOffset = Math.round(markerSize * 0.4); // afasta mais a bolinha de quantidade
    const isReserved = marker.table_id && reservedTableIds.has(marker.table_id);
    const bgColor = isReserved ? "#ff4d4f" : "#2b8aef";

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
          boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
          background: bgColor,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: Math.max(10, Math.round(markerSize * 0.45)),
          fontWeight: 600,
          cursor: "grab",
          pointerEvents: "auto",
          userSelect: "none",
        }}
        title={`Mesa ${marker.table_number || marker.id} — ${
          marker.chairs
        } cadeira(s)${isReserved ? " (reservada)" : ""}`}
        onMouseDown={onMouseDown}
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
            background: "#ff7a45",
            color: "#fff",
            fontSize: Math.max(9, Math.round(markerSize * 0.35)),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #fff",
          }}
        >
          {marker.chairs}
        </div>
      </div>
    );
  }

  return (
    <div className="stage">
      <h2>Mapa de Mesas (Admin)</h2>
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
            onClick={handleImageClick}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: 400,
              background: "#fff",
              border: "1px solid #ddd",
            }}
            onClick={handleImageClick}
          />
        )}
        <div
          className="overlay"
          ref={overlayRef}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          {markers.map(renderMarker)}
        </div>
      </div>
      <div
        className="controls"
        style={{
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Button
          type={addMode ? "primary" : "default"}
          onClick={() => setAddMode((m) => !m)}
        >
          {addMode ? "Modo: Adicionar" : "Modo: Navegar"}
        </Button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 240,
          }}
        >
          <span style={{ whiteSpace: "nowrap" }}>Tamanho dos pontos:</span>
          <div style={{ width: 200 }}>
            <Slider
              min={12}
              max={48}
              step={2}
              value={markerSize}
              onChange={setMarkerSize}
            />
          </div>
        </div>
      </div>
      <Modal
        open={modal.visible}
        title={
          modal.marker?.table_number
            ? `Mesa ${modal.marker.table_number}`
            : `Adicionar mesa #${modal.marker?.id}`
        }
        onCancel={() => setModal({ visible: false, marker: null })}
        onOk={async () => {
          if (markers.some((m) => m.id === modal.marker?.id)) {
            // Atualiza apenas as cadeiras, preservando a posição atual
            try {
              const { data } = await api.put(`/table-map/${modal.marker.id}`, {
                chairs: modal.marker.chairs,
              });
              setMarkers((prev) =>
                prev.map((m) =>
                  m.id === modal.marker.id ? { ...m, chairs: data.chairs } : m
                )
              );
              setModal({ visible: false, marker: null });
              message.success("Mesa atualizada!");
            } catch (err) {
              console.error(err);
              message.error("Erro ao atualizar mesa");
            }
          } else {
            await saveMarker(modal.marker);
          }
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span>Quantidade de cadeiras:</span>
          <InputNumber
            min={1}
            max={20}
            value={modal.marker?.chairs}
            onChange={(val) =>
              setModal((m) => ({ ...m, marker: { ...m.marker, chairs: val } }))
            }
          />
        </div>
        {markers.some((m) => m.id === modal.marker?.id) && (
          <div style={{ marginTop: 12, textAlign: "right" }}>
            <Button
              danger
              onClick={() => {
                removeMarker(modal.marker);
                setModal({ visible: false, marker: null });
              }}
            >
              Remover mesa
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminTableMap;
