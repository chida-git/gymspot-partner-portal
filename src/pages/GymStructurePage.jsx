import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Form, Input, InputNumber, Modal, Space, Table, Tag, message } from 'antd';
import {
  getGymCapacityConfig, updateGymCapacityConfig,
  getGymHalls, createGymHall, updateGymHall, deleteGymHall
} from '../services/api';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
// se hai un AuthContext che espone la palestra corrente, usalo; altrimenti fallback 1
 import { useAuth } from '../context/AuthContext';

const useAsync = (fn) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(undefined);
  const run = async (...args) => {
    setLoading(true);
    try {
      const res = await fn(...args);
      setData(res?.data ?? res);
      return res?.data ?? res;
    } finally { setLoading(false); }
  };
  return { loading, data, run, setData };
};

export default function GymStructurePage() {
  const { user } = useAuth(); // assumo contenga gymId o simile
  // se non lo hai, ricava l'id da URL (useParams) o dal contesto
  const gymId = user?.gym_id ?? 1;

  // ---- CAPACITY ----
  const cap = useAsync(() => getGymCapacityConfig(gymId));
  const [capForm] = Form.useForm();

  // ---- HALLS ----
  const halls = useAsync(() => getGymHalls(gymId));
  const [hallModalOpen, setHallModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState(null);
  const [hallForm] = Form.useForm();

  const loadAll = async () => {
    const c = await cap.run();
    capForm.setFieldsValue({ max_capacity: c?.max_capacity ?? 0, note: c?.note ?? '' });
    await halls.run();
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);

  // ---- CAPACITY save ----
  const saveCapacity = async () => {
    const v = await capForm.validateFields();
    await updateGymCapacityConfig(gymId, { max_capacity: v.max_capacity ?? 0, note: v.note ?? null });
    message.success('Capienza palestra aggiornata');
    loadAll();
  };

  // ---- HALLS CRUD ----
  const openCreateHall = () => { setEditingHall(null); hallForm.resetFields(); setHallModalOpen(true); };
  const openEditHall = (row) => { setEditingHall(row); hallForm.setFieldsValue(row); setHallModalOpen(true); };

  const submitHall = async () => {
    const v = await hallForm.validateFields();
    if (editingHall) {
      await updateGymHall(editingHall.id, { name: v.name, max_capacity: v.max_capacity, description: v.description || null });
      message.success('Sala aggiornata');
    } else {
      await createGymHall({ gym_id: gymId, name: v.name, max_capacity: v.max_capacity, description: v.description || null });
      message.success('Sala creata');
    }
    setHallModalOpen(false);
    halls.run(gymId);
  };

  const removeHall = (row) => {
    Modal.confirm({
      title: 'Eliminare la sala?',
      content: row.name,
      okType: 'danger',
      onOk: async () => {
        await deleteGymHall(row.id);
        message.success('Sala eliminata');
        halls.run(gymId);
      }
    });
  };

  const totalByHalls = useMemo(() => (halls.data || []).reduce((s, h) => s + (h.max_capacity || 0), 0), [halls.data]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* CAPACITÀ PALESTRA */}
      <Card
        title="Capienza palestra"
        extra={<Button type="primary" icon={<SaveOutlined />} onClick={saveCapacity}>Salva</Button>}
      >
        <Form form={capForm} layout="inline">
          <Form.Item
            name="max_capacity"
            label="Capienza massima"
            rules={[{ required: true, type: 'number', min: 0 }]}
          >
            <InputNumber style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="note" label="Note" style={{ minWidth: 320, flex: 1 }}>
            <Input placeholder="es. include aree comuni..." />
          </Form.Item>
          <Tag style={{ marginLeft: 8 }}>
            Somma capienza sale: <b style={{ marginLeft: 4 }}>{totalByHalls}</b>
          </Tag>
        </Form>
      </Card>

      {/* SALE */}
      <Card
        title="Sale"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreateHall}>Nuova sala</Button>}
      >
        <Table
          rowKey="id"
          loading={halls.loading}
          dataSource={halls.data || []}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 80 },
            { title: 'Nome', dataIndex: 'name' },
            { title: 'Capienza', dataIndex: 'max_capacity', width: 120 },
            { title: 'Descrizione', dataIndex: 'description' },
            {
              title: 'Azioni',
              width: 160,
              render: (_, row) => (
                <Space>
                  <Button icon={<EditOutlined />} onClick={() => openEditHall(row)} />
                  <Button icon={<DeleteOutlined />} danger onClick={() => removeHall(row)} />
                </Space>
              )
            }
          ]}
        />
      </Card>

      <Modal
        title={editingHall ? 'Modifica sala' : 'Nuova sala'}
        open={hallModalOpen}
        onCancel={() => setHallModalOpen(false)}
        onOk={submitHall}
        okText="Salva"
      >
        <Form form={hallForm} layout="vertical" initialValues={{ max_capacity: 0 }}>
          <Form.Item name="name" label="Nome sala" rules={[{ required: true }]}>
            <Input placeholder="es. Sala Pesi, Cardio, Functional..." />
          </Form.Item>
          <Form.Item name="max_capacity" label="Capienza" rules={[{ required: true, type: 'number', min: 0 }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Descrizione">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
