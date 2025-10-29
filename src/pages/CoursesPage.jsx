// src/pages/CoursesPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Card, Row, Col, Space, Button, Table, Tag, Modal, Form, Input,
  InputNumber, Select, TimePicker, DatePicker, Divider, message
} from "antd";
import dayjs from "dayjs";
import {
  getCourseTypes, getWeeklySlots, getSchedule,
  createCourseType, createWeeklySlot, updateCourseType, updateWeeklySlot
} from "../services/api";
import { useAuth } from '../context/AuthContext'; // supponendo esista
import GymHeader from '../components/GymHeader.jsx';

const { RangePicker } = DatePicker;

const WEEKDAYS = [
  { value: 0, label: "Lunedì" },
  { value: 1, label: "Martedì" },
  { value: 2, label: "Mercoledì" },
  { value: 3, label: "Giovedì" },
  { value: 4, label: "Venerdì" },
  { value: 5, label: "Sabato" },
  { value: 6, label: "Domenica" },
];

function useGymId() {
  try 
  { 
    const { user } = useAuth();
    return user?.gymId ?? 1; 
  }
  catch { return null; }
}


export default function CoursesPage() {
  const gymId = useGymId();
  const [loading, setLoading] = useState(true);
  const [courseTypes, setCourseTypes] = useState([]);
  const [weeklySlots, setWeeklySlots] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [selectedType, setSelectedType] = useState(undefined);
  const [visibleEditSlot, setVisibleEditSlot] = useState(false);
const [editingSlot, setEditingSlot] = useState(null);
const [formEditSlot] = Form.useForm();
const [updatingCourseId, setUpdatingCourseId] = useState(null);

async function toggleCourseStatus(row, nextStatus) {
  try {
    setUpdatingCourseId(row.id);
    // update ottimistico
    setCourseTypes(prev => prev.map(ct => ct.id === row.id ? { ...ct, status: nextStatus } : ct));
    await updateCourseType(row.id, { status: nextStatus });
    message.success(`Corso ${nextStatus === 'active' ? 'attivato' : 'disattivato'}`);
    // opzionale: ricarica dal backend se vuoi stato 100% source-of-truth
    // await fetchAll();
  } catch (e) {
    // rollback se c'è errore
    setCourseTypes(prev => prev.map(ct => ct.id === row.id ? { ...ct, status: row.status } : ct));
    message.error(e?.response?.data?.message || e.message);
  } finally {
    setUpdatingCourseId(null);
  }
}

  // period predefinito: prossime 2 settimane
  const [range, setRange] = useState([
    dayjs().startOf("day"),
    dayjs().add(14, "day").startOf("day"),
  ]);

  // modali
  const [visibleNewType, setVisibleNewType] = useState(false);
  const [visibleNewSlot, setVisibleNewSlot] = useState(false);

  const [formType] = Form.useForm();
  const [formSlot] = Form.useForm();

  const fetchAll = async () => {
    if (!gymId) return;
    setLoading(true);
    try {
      const [ct, ws] = await Promise.all([
        getCourseTypes(gymId),
        getWeeklySlots(gymId),
      ]);
      setCourseTypes(ct.data || []);
      setWeeklySlots(ws.data || []);
      await fetchSchedule();
    } catch (e) {
      message.error(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    if (!gymId) return;
    const params = {
      from: range[0].format("YYYY-MM-DD"),
      to: range[1].format("YYYY-MM-DD"),
    };
    if (selectedType) params.courseTypeId = selectedType;
    const r = await getSchedule(gymId, params);
    setSchedule(r.data || []);
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [gymId]);
  useEffect(() => { fetchSchedule(); /* eslint-disable-next-line */ }, [range, selectedType]);

  const slotsTable = useMemo(() => {
    return weeklySlots
      .map(s => ({
        key: s.id,
        weekday: WEEKDAYS.find(w => w.value === s.weekday)?.label ?? s.weekday,
        time: s.startTime,
        duration: `${s.durationMin}′`,
        course: s.courseName || s.courseTypeId,
        capacity: s.capacity ?? "-",
        active: !!s.isActive,
      }))
      .sort((a, b) =>
        WEEKDAYS.findIndex(w => w.label === a.weekday) - WEEKDAYS.findIndex(w => w.label === b.weekday)
        || a.time.localeCompare(b.time)
      );
  }, [weeklySlots]);

  const scheduleTable = useMemo(() => {
    return (schedule || []).map((it, idx) => ({
      key: `${it.weeklySlotId}-${idx}`,
      date: dayjs(it.startsAt).format("DD/MM/YYYY"),
      start: dayjs(it.startsAt).format("HH:mm:ss"),
      end: dayjs(it.endsAt).format("HH:mm:ss"),
      course: it.courseName,
      status: it.status,
      notes: it.notes || "",
    }));
  }, [schedule]);

  const onSubmitNewType = async (values) => {
    try {
      await createCourseType(gymId, {
        name: values.name,
        durationMin: values.durationMin,
        description: values.description || undefined,
        level: values.level || undefined,
        status: values.status || "active",
      });
      message.success("Tipo corso creato");
      setVisibleNewType(false);
      formType.resetFields();
      fetchAll();
    } catch (e) {
      message.error(e?.response?.data?.message || e.message);
    }
  };

  const onSubmitNewSlot = async (values) => {
    try {
      await createWeeklySlot(gymId, {
        courseTypeId: values.courseTypeId,
        weekday: values.weekday,
        startTime: values.startTime.format("HH:mm"),
        durationMin: values.durationMin,
        capacity: values.capacity ?? null,
        isActive: values.isActive ?? true,
        notes: values.notes || null,
      });
      message.success("Fascia oraria creata");
      setVisibleNewSlot(false);
      formSlot.resetFields();
      fetchAll();
    } catch (e) {
      message.error(e?.response?.data?.message || e.message);
    }
  };

  return (
    <div>    <GymHeader gymId={gymId} />
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Row gutter={16} align="middle">
        <Col flex="auto">
          <h2 style={{ margin: 0 }}>Corsi</h2>
        </Col>
        <Col>
          <Space>
            <Select
              allowClear
              placeholder="Filtra per tipo"
              style={{ width: 220 }}
              value={selectedType}
              onChange={setSelectedType}
              options={courseTypes.map(ct => ({ value: ct.id, label: ct.name }))}
            />
            <RangePicker
              value={range}
              onChange={(vals) => vals && setRange(vals)}
              format="DD/MM/YYYY"
              allowClear={false}
            />
            <Button type="primary" onClick={() => setVisibleNewType(true)}>
              Nuovo tipo corso
            </Button>
            <Button onClick={() => setVisibleNewSlot(true)}>
              Aggiungi fascia oraria
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={10}>
          <Card title={`Tipi di corso (${courseTypes.length})`} loading={loading}>
            <Table
  size="small"
  rowKey="id"
  pagination={false}
  dataSource={courseTypes}
  columns={[
    { title: "Nome", dataIndex: "name" },
    { title: "Durata", dataIndex: "durationMin", render: (v) => `${v}′`, width: 90 },
    { title: "Livello", dataIndex: "level", width: 120, render: v => v || "-" },
    {
      title: "Stato",
      dataIndex: "status",
      width: 110,
      render: (s) => <Tag color={s === "active" ? "green" : "default"}>{s}</Tag>,
    },
    {
      title: "Azioni",
      key: "actions",
      width: 180,
      render: (_, r) => (
        <Space>
          {r.status === "active" ? (
            <Button
              size="small"
              danger
              loading={updatingCourseId === r.id}
              onClick={() => toggleCourseStatus(r, "inactive")}
            >
              Disattiva
            </Button>
          ) : (
            <Button
              size="small"
              type="primary"
              ghost
              loading={updatingCourseId === r.id}
              onClick={() => toggleCourseStatus(r, "active")}
            >
              Attiva
            </Button>
          )}
        </Space>
      )
    }
  ]}
/>
          </Card>
        </Col>
        <Col span={14}>
          <Card title="Fasce settimanali" loading={loading}>
            <Table
  size="small"
  pagination={false}
  dataSource={slotsTable}
  columns={[
    { title: "Giorno", dataIndex: "weekday", width: 130 },
    { title: "Ora", dataIndex: "time", width: 110 },
    { title: "Durata", dataIndex: "duration", width: 90 },
    { title: "Corso", dataIndex: "course" },
    { title: "Capienza", dataIndex: "capacity", width: 100 },
    {
      title: "Attivo",
      dataIndex: "active",
      width: 90,
      render: v => (v ? <Tag color="green">sì</Tag> : <Tag>no</Tag>)
    },
    {
      title: "Azioni",
      key: "actions",
      width: 120,
      render: (_, recRaw) => {
        // recRaw.key è l'id dello slot originale (mappato in slotsTable)
        const original = weeklySlots.find(s => s.id === recRaw.key);
        return (
          <Space>
            <Button size="small" onClick={() => {
              setEditingSlot(original);
              formEditSlot.setFieldsValue({
                courseTypeId: original.courseTypeId,
                weekday: original.weekday,
                startTime: dayjs(original.startTime, "HH:mm"),
                durationMin: original.durationMin,
                capacity: original.capacity ?? null,
                isActive: !!original.isActive,
                notes: original.notes || "",
              });
              setVisibleEditSlot(true);
            }}>
              Modifica
            </Button>
          </Space>
        );
      }
    }
  ]}
/>
          </Card>
        </Col>
      </Row>

      <Card title="Calendario (generato)">
        <Table
          size="small"
          dataSource={scheduleTable}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: "Data", dataIndex: "date", width: 110 },
            { title: "Inizio", dataIndex: "start", width: 110 },
            { title: "Fine", dataIndex: "end", width: 110 },
            { title: "Corso", dataIndex: "course" },
            {
              title: "Stato",
              dataIndex: "status",
              width: 120,
              render: s => <Tag color={s === "scheduled" ? "blue" : "red"}>{s}</Tag>
            },
            { title: "Note", dataIndex: "notes" },
          ]}
        />
      </Card>

      {/* Modal: nuovo tipo corso */}
      <Modal
        title="Nuovo tipo di corso"
        open={visibleNewType}
        onCancel={() => setVisibleNewType(false)}
        onOk={() => formType.submit()}
        okText="Crea"
        destroyOnClose
      >
        <Form form={formType} layout="vertical" onFinish={onSubmitNewType}>
          <Form.Item label="Nome" name="name" rules={[{ required: true }]}>
            <Input placeholder="Zumba" />
          </Form.Item>
          <Form.Item label="Durata (minuti)" name="durationMin" rules={[{ required: true }]}>
            <InputNumber min={10} step={5} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Livello" name="level">
            <Input placeholder="All levels / Beginner…" />
          </Form.Item>
          <Form.Item label="Descrizione" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Stato" name="status" initialValue="active">
            <Select
              options={[
                { value: "active", label: "active" },
                { value: "inactive", label: "inactive" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal: nuova fascia oraria */}
      <Modal
        title="Aggiungi fascia settimanale"
        open={visibleNewSlot}
        onCancel={() => setVisibleNewSlot(false)}
        onOk={() => formSlot.submit()}
        okText="Aggiungi"
        destroyOnClose
      >
        <Form
          form={formSlot}
          layout="vertical"
          onFinish={onSubmitNewSlot}
          initialValues={{ isActive: true }}
        >
          <Form.Item label="Tipo corso" name="courseTypeId" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="Seleziona corso"
              options={courseTypes.map(ct => ({ value: ct.id, label: ct.name }))}
              filterOption={(input, opt) => (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
          <Form.Item label="Giorno della settimana" name="weekday" rules={[{ required: true }]}>
            <Select options={WEEKDAYS} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Ora inizio" name="startTime" rules={[{ required: true }]}>
                <TimePicker format="HH:mm" style={{ width: "100%" }} minuteStep={5} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Durata (min)" name="durationMin" rules={[{ required: true }]}>
                <InputNumber min={10} step={5} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Capienza (opzionale)" name="capacity">
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Note" name="notes">
            <Input />
          </Form.Item>
          <Form.Item name="isActive" valuePropName="checked">
            <Select
              value={undefined}
              style={{ display: "none" }}
            />
          </Form.Item>
          <Divider />
          <Space>
            <Tag color="blue">Ricorrenza settimanale</Tag>
            <span style={{ opacity: .7 }}>usa “Override” API per eccezioni ferie/festivi</span>
          </Space>
        </Form>
      </Modal>

      <Modal
  title="Modifica fascia settimanale"
  open={visibleEditSlot}
  onCancel={() => setVisibleEditSlot(false)}
  onOk={() => formEditSlot.submit()}
  okText="Salva"
  destroyOnClose
>
  <Form
    form={formEditSlot}
    layout="vertical"
    onFinish={async (values) => {
      try {
        await updateWeeklySlot(editingSlot.id, {
          gymId: gymId,
          courseTypeId: values.courseTypeId,
          weekday: values.weekday,
          startTime: values.startTime.format("HH:mm"),
          durationMin: values.durationMin,
          capacity: values.capacity ?? null,
          isActive: values.isActive ?? true,
          notes: values.notes || null,
        });
        message.success("Fascia aggiornata");
        setVisibleEditSlot(false);
        setEditingSlot(null);
        fetchAll();
      } catch (e) {
        message.error(e?.response?.data?.message || e.message);
      }
    }}
  >
    <Form.Item label="Tipo corso" name="courseTypeId" rules={[{ required: true }]}>
      <Select
        showSearch placeholder="Seleziona corso"
        options={courseTypes.map(ct => ({ value: ct.id, label: ct.name }))}
        filterOption={(input, opt) => (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())}
      />
    </Form.Item>

    <Form.Item label="Giorno" name="weekday" rules={[{ required: true }]}>
      <Select options={WEEKDAYS} />
    </Form.Item>

    <Row gutter={12}>
      <Col span={12}>
        <Form.Item label="Ora inizio" name="startTime" rules={[{ required: true }]}>
          <TimePicker format="HH:mm" style={{ width: "100%" }} minuteStep={5} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Durata (min)" name="durationMin" rules={[{ required: true }]}>
          <InputNumber min={10} step={5} style={{ width: "100%" }} />
        </Form.Item>
      </Col>
    </Row>

    <Form.Item label="Capienza (opz.)" name="capacity">
      <InputNumber min={1} style={{ width: "100%" }} />
    </Form.Item>

    <Form.Item label="Note" name="notes">
      <Input />
    </Form.Item>
  </Form>
</Modal>
    </Space>
    </div>
  );
}
