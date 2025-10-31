// src/pages/EquipmentPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Button, Card, Col, Drawer, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tabs, Tag, message
} from 'antd';
import {
  getEquipmentCategories, createEquipmentCategory, updateEquipmentCategory, deleteEquipmentCategory,
  getEquipmentModels, createEquipmentModel, updateEquipmentModel, deleteEquipmentModel,
  getEquipmentModelSpecs, replaceEquipmentModelSpecs,
  getEquipmentAssets, createEquipmentAsset, updateEquipmentAsset, deleteEquipmentAsset,
  getEquipmentStock, createEquipmentStock, updateEquipmentStock, deleteEquipmentStock,
  getEquipmentStockSpecs, replaceEquipmentStockSpecs
} from '../services/api';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext'; // se non c'è, sostituisci con il tuo hook per gym

const { Option } = Select;

/** Util */
const useAsync = (fn, deps = []) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(undefined);
  const [error, setError] = useState(null);
  const run = async (...args) => {
    try {
      setLoading(true);
      const out = await fn(...args);
      setData(out);
      setError(null);
      return out;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };
  // eslint-disable-next-line
  useEffect(() => { /* no auto */ }, deps);
  return { loading, data, error, run, setData };
};

/* ============================
 * TAB 1 — CATEGORIE
 * ============================ */
function CategoriesTab() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const { loading, data, run } = useAsync(getEquipmentCategories, []);

    const { user } = useAuth?.() || {};
  const gymId = user?.gym_id || 1;

  const reload = async () => {
    await run({ search, limit: 200, gym_id: gymId });
  };
  useEffect(() => { reload(); }, []); // initial

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (row) => { setEditing(row); form.setFieldsValue({ name: row.name, parent_id: row.parent_id, gym_id: gymId }); setModalOpen(true); };

  const onSubmit = async () => {
    const v = await form.validateFields();
    if (editing) {
      await updateEquipmentCategory(editing.id, v);
      message.success('Categoria aggiornata');
    } else {
      const payload = { ...v, gym_id: gymId };
      await createEquipmentCategory(payload);
      message.success('Categoria creata');
    }
    setModalOpen(false);
    reload();
  };

  const onDelete = async (row) => {
    Modal.confirm({
      title: 'Elimina categoria?',
      content: row.name,
      okType: 'danger',
      onOk: async () => {
        await deleteEquipmentCategory(row.id);
        message.success('Eliminata');
        reload();
      }
    });
  };

  const text = v => (v === null || v === undefined) ? '—' : String(v);

  return (
    <Card
      title={
        <Space>
          Categorie
          <Input.Search allowClear placeholder="Cerca" onSearch={() => reload()} value={search} onChange={e => setSearch(e.target.value)} />
        </Space>
      }
      extra={<Button icon={<PlusOutlined />} type="primary" onClick={openCreate}>Nuova</Button>}
    >
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data?.data || []}
        pagination={false}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 80, render: text },
          { title: 'Nome', dataIndex: 'name', render: text },
          {
            title: 'Azioni',
            width: 160,
            render: (_, row) => (
              <Space>
                <Button icon={<EditOutlined />} onClick={() => openEdit(row)} />
                <Button icon={<DeleteOutlined />} danger onClick={() => onDelete(row)} />
              </Space>
            )
          }
        ]}
      />

      <Modal
        title={editing ? 'Modifica categoria' : 'Nuova categoria'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={onSubmit}
        okText="Salva"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Nome" rules={[{ required: true, message: 'Obbligatorio' }]}>
            <Input maxLength={80} />
          </Form.Item>
          <Form.Item name="parent_id" label="Parent ID">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

/* ============================
 * TAB 2 — MODELLI (+ specs)
 * ============================ */
function ModelsTab() {
  const [filters, setFilters] = useState({ search: '', category_id: undefined, is_track_per_item: undefined });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const categories = useAsync(getEquipmentCategories, []);
  const models = useAsync(getEquipmentModels, []);

  const { user } = useAuth?.() || {};
  const gymId = user?.gym_id || 1;

  const reload = async () => {
    await models.run({
      search: filters.search || undefined,
      category_id: filters.category_id || undefined,
      is_track_per_item: filters.is_track_per_item ?? undefined,
      limit: 100,
      gym_id: gymId
    });
  };

  useEffect(() => { categories.run({ limit: 200, gym_id: gymId }); reload(); }, []); // init

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ is_track_per_item: true, specs: [{ spec_key: 'weight_kg', spec_value: '' }] });
    setDrawerOpen(true);
  };

  const openEdit = async (row) => {
    setEditing(row);
    form.setFieldsValue({
      category_id: row.category_id,
      brand: row.brand,
      model_name: row.model_name,
      sku: row.sku,
      description: row.description,
      photo_url: row.photo_url,
      is_track_per_item: !!row.is_track_per_item
    });
    const specs = await getEquipmentModelSpecs(row.id);
const flatSpecs = (specs?.data || [])
    .flat()
    .filter(s => s && s.spec_key)
    .map(s => ({ spec_key: s.spec_key, spec_value: s.spec_value }));

  form.setFieldsValue({ specs: flatSpecs });
    setDrawerOpen(true);
  };

  const onSubmit = async () => {
    const v = await form.validateFields();
    const payload = {
      category_id: v.category_id,
      brand: v.brand,
      model_name: v.model_name,
      sku: v.sku,
      description: v.description,
      photo_url: v.photo_url,
      is_track_per_item: v.is_track_per_item,
      gym_id: gymId
    };
    if (!editing) {
      payload.specs = (v.specs || []).filter(s => s?.spec_key && s?.spec_value);
      await createEquipmentModel(payload);
      message.success('Modello creato');
    } else {
      await updateEquipmentModel(editing.id, payload);
          const specsPayload = {
      specs: (v.specs || []).filter(s => s?.spec_key && s?.spec_value),
      gym_id: gymId,
    };
      await replaceEquipmentModelSpecs(editing.id, specsPayload);
      message.success('Modello aggiornato');
    }
    setDrawerOpen(false);
    reload();
  };

  const onDelete = async (row) => {
    Modal.confirm({
      title: 'Elimina modello?',
      content: `${row.brand || ''} ${row.model_name}`,
      okType: 'danger',
      onOk: async () => { await deleteEquipmentModel(row.id); message.success('Eliminato'); reload(); }
    });
  };

  const text = v => (v === null || v === undefined) ? '—' : String(v);

  return (
    <Card
      title="Modelli"
      extra={
        <Space>
          <Input.Search
            allowClear
            placeholder="Cerca brand/modello"
            style={{ width: 220 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onSearch={reload}
          />
          <Select
            allowClear placeholder="Categoria" style={{ width: 200 }}
            value={filters.category_id}
            onChange={(v) => setFilters({ ...filters, category_id: v })}
            options={(categories.data?.data || []).map(c => ({ value: c.id, label: c.name }))}
            onDropdownVisibleChange={(v) => v && categories.run({ limit: 200 })}
          />
          <Select
            allowClear placeholder="Tracciamento"
            style={{ width: 160 }}
            value={filters.is_track_per_item}
            onChange={(v) => setFilters({ ...filters, is_track_per_item: v })}
            options={[
              { value: true, label: 'Per pezzo' },
              { value: false, label: 'A quantità' }
            ]}
          />
          <Button onClick={reload}>Filtra</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Nuovo</Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        loading={models.loading}
        dataSource={models.data?.data || []}
        pagination={{ pageSize: 20 }}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 80, render: text },
          { title: 'Categoria', dataIndex: 'category_name', render: text },
          { title: 'Brand', dataIndex: 'brand', render: text },
          { title: 'Modello', dataIndex: 'model_name', render: text },
          { title: 'SKU', dataIndex: 'sku', render: text },
          {
            title: 'Traccia',
            dataIndex: 'is_track_per_item',
            render: v => v ? <Tag color="blue">Per pezzo</Tag> : <Tag>Quantità</Tag>
          },
          {
            title: 'Azioni',
            width: 160,
            render: (_, row) => (
              <Space>
                <Button icon={<EditOutlined />} onClick={() => openEdit(row)} />
                <Button icon={<DeleteOutlined />} danger onClick={() => onDelete(row)} />
              </Space>
            )
          }
        ]}
      />

      <Drawer
        title={editing ? 'Modifica modello' : 'Nuovo modello'}
        width={560}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={<Space><Button onClick={() => setDrawerOpen(false)}>Annulla</Button><Button type="primary" onClick={onSubmit}>Salva</Button></Space>}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="category_id" label="Categoria" rules={[{ required: true }]}>
            <Select options={(categories.data?.data || []).map(c => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="brand" label="Brand"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="sku" label="SKU"><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="model_name" label="Modello" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Descrizione"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="photo_url" label="Foto URL"><Input /></Form.Item>
          <Form.Item name="is_track_per_item" label="Tracciamento" rules={[{ required: true }]}>
            <Select options={[{ value: true, label: 'Per pezzo' }, { value: false, label: 'A quantità' }]} />
          </Form.Item>

          <Form.List name="specs">
            {(fields, { add, remove }) => (
              <Card size="small" title="Specifiche (key/value)" extra={<Button onClick={() => add()} type="dashed">Aggiungi</Button>}>
                {fields.map((f) => (
                  <Row gutter={8} key={f.key} style={{ marginBottom: 8 }}>
                    <Col span={10}><Form.Item name={[f.name, 'spec_key']} rules={[{ required: true }]}><Input placeholder="es. weight_kg" /></Form.Item></Col>
                    <Col span={10}><Form.Item name={[f.name, 'spec_value']} rules={[{ required: true }]}><Input placeholder="es. 20" /></Form.Item></Col>
                    <Col span={4}><Button danger onClick={() => remove(f.name)} block>Rimuovi</Button></Col>
                  </Row>
                ))}
              </Card>
            )}
          </Form.List>
        </Form>
      </Drawer>
    </Card>
  );
}

/* ============================
 * TAB 3 — ASSET
 * ============================ */
function AssetsTab() {
  const { user } = useAuth?.() || {};
  const gymId = user?.gym_id || 1;

  const [filters, setFilters] = useState({ q: '', status_enum: undefined, model_id: undefined, location_id: undefined });
  const models = useAsync(getEquipmentModels, []);
  const assets = useAsync(getEquipmentAssets, []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const reload = async () => {
    await assets.run({ gym_id: gymId, ...filters, limit: 100 });
  };
  useEffect(() => { models.run({ limit: 200, gym_id: gymId }); reload(); }, []); // init

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (row) => { setEditing(row); form.setFieldsValue(row); setModalOpen(true); };

  const onSubmit = async () => {
    const v = await form.validateFields();
    if (editing) {
      await updateEquipmentAsset(editing.id, v);
      message.success('Asset aggiornato');
    } else {
      await createEquipmentAsset({ ...v, gym_id: gymId });
      message.success('Asset creato');
    }
    setModalOpen(false);
    reload();
  };

  const onDelete = async (row) => {
    Modal.confirm({
      title: 'Elimina asset?',
      content: `${row.tag_code || ''} ${row.model_name || ''}`,
      okType: 'danger',
      onOk: async () => { await deleteEquipmentAsset(row.id); message.success('Eliminato'); reload(); }
    });
  };

   const text = v => (v === null || v === undefined) ? '—' : String(v);

  return (
    <Card
      title="Asset (pezzi singoli)"
      extra={
        <Space>
          <Input.Search allowClear placeholder="Cerca tag/serial/brand" style={{ width: 220 }}
            value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} onSearch={reload} />
          <Select allowClear placeholder="Stato" style={{ width: 160 }} value={filters.status_enum}
            onChange={(v) => setFilters({ ...filters, status_enum: v })}
            options={['active','maintenance','retired','lost'].map(s => ({ value: s, label: s }))} />
          <Select allowClear placeholder="Modello" style={{ width: 220 }} value={filters.model_id}
            onChange={(v) => setFilters({ ...filters, model_id: v })}
            options={(models.data?.data || []).map(m => ({ value: m.id, label: `${m.brand || ''} ${m.model_name}` }))} />
          <Button onClick={reload}>Filtra</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Nuovo</Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        loading={assets.loading}
        dataSource={assets.data?.data || []}
        pagination={{ pageSize: 20 }}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 80, render: text },
          { title: 'Modello', render: (_, r) => <span>{r.brand} {r.model_name}</span> },
          { title: 'Tag', dataIndex: 'tag_code', render: text },
          { title: 'Serial', dataIndex: 'serial_number', render: text },
          { title: 'Location', dataIndex: 'location_id', render: text },
          { title: 'Condizione', dataIndex: 'condition_enum', render: v => <Tag>{v}</Tag> },
          { title: 'Status', dataIndex: 'status_enum', render: v => <Tag color={v==='active'?'green': v==='maintenance'?'orange':'red'}>{v}</Tag> },
          {
            title: 'Azioni',
            width: 160,
            render: (_, row) => (
              <Space>
                <Button icon={<EditOutlined />} onClick={() => openEdit(row)} />
                <Button icon={<DeleteOutlined />} danger onClick={() => onDelete(row)} />
              </Space>
            )
          }
        ]}
      />

      <Modal
        title={editing ? 'Modifica asset' : 'Nuovo asset'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={onSubmit}
        okText="Salva"
      >
        <Form form={form} layout="vertical" initialValues={{ status_enum: 'active', condition_enum: 'good' }}>
          <Form.Item name="model_id" label="Modello" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label"
              options={(models.data?.data || []).map(m => ({ value: m.id, label: `${m.brand || ''} ${m.model_name}` }))} />
          </Form.Item>
          <Row gutter={8}>
            <Col span={12}><Form.Item name="tag_code" label="Tag"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="serial_number" label="Serial"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={8}>
            <Col span={12}><Form.Item name="condition_enum" label="Condizione" rules={[{ required: true }]}>
              <Select options={['new','good','worn','damaged','out_of_service'].map(v => ({ value: v, label: v }))} />
            </Form.Item></Col>
            <Col span={12}><Form.Item name="status_enum" label="Status" rules={[{ required: true }]}>
              <Select options={['active','maintenance','retired','lost'].map(v => ({ value: v, label: v }))} />
            </Form.Item></Col>
          </Row>
          <Form.Item name="notes" label="Note"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

/* ============================
 * TAB 4 — STOCK (+ specs)
 * ============================ */
function StockTab() {
  const { user } = useAuth?.() || {};
  const gymId = user?.gym_id || 1;

  const [filters, setFilters] = useState({ q: '', model_id: undefined, location_id: undefined });
  const models = useAsync(getEquipmentModels, []);
  const stock = useAsync(getEquipmentStock, []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const reload = async () => {
    await stock.run({ gym_id: gymId, ...filters, limit: 200 });
  };
  useEffect(() => { models.run({ limit: 200, gym_id: gymId }); reload(); }, []);

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = async (row) => {
    setEditing(row);
    form.setFieldsValue(row);
    const specs = await getEquipmentStockSpecs(row.id);
    form.setFieldsValue({ specs: (specs?.data || []).map(s => ({ spec_key: s.spec_key, spec_value: s.spec_value })) });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    const v = await form.validateFields();
    if (editing) {
      await updateEquipmentStock(editing.id, {
        variant_label: v.variant_label,
        location_id: v.location_id,
        quantity: v.quantity,
        min_quantity: v.min_quantity
      });
      await replaceEquipmentStockSpecs(editing.id, (v.specs || []).filter(s => s?.spec_key && s?.spec_value));
      message.success('Stock aggiornato');
    } else {
      const { data: created } = await createEquipmentStock({
        gym_id: gymId,
        model_id: v.model_id,
        location_id: v.location_id || null,
        variant_label: v.variant_label || null,
        quantity: v.quantity || 0,
        min_quantity: v.min_quantity || 0
      });
      if (v.specs?.length) await replaceEquipmentStockSpecs(created.id, v.specs.filter(s => s?.spec_key && s?.spec_value));
      message.success('Stock creato');
    }
    setModalOpen(false);
    reload();
  };

  const onDelete = async (row) => {
    Modal.confirm({
      title: 'Elimina stock?',
      content: `${row.model_name} — ${row.variant_label || 'default'}`,
      okType: 'danger',
      onOk: async () => { await deleteEquipmentStock(row.id); message.success('Eliminato'); reload(); }
    });
  };

  const incDec = async (row, delta) => {
    await updateEquipmentStock(row.id, { quantity_delta: delta });
    reload();
  };

  const text = v => (v === null || v === undefined) ? '—' : String(v);

  return (
    <Card
      title="Stock (articoli a quantità)"
      extra={
        <Space>
          <Input.Search allowClear placeholder="Cerca modello/variante" style={{ width: 220 }}
            value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} onSearch={reload} />
          <Select allowClear placeholder="Modello" style={{ width: 260 }} value={filters.model_id}
            onChange={(v) => setFilters({ ...filters, model_id: v })}
            options={(models.data?.data || []).map(m => ({ value: m.id, label: `${m.brand || ''} ${m.model_name}` }))} />
          <Button onClick={reload}>Filtra</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Nuovo</Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        loading={stock.loading}
        dataSource={stock.data?.data || []}
        pagination={{ pageSize: 20 }}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 80, render: text },
          { title: 'Modello', render: (_, r) => <span>{r.brand} {r.model_name}</span> },
          { title: 'Variante', dataIndex: 'variant_label', render: v => v || <Tag>default</Tag> },
          { title: 'Location', dataIndex: 'location_id', render: text },
          { title: 'Qty', dataIndex: 'quantity', width: 120,
            render: (v, row) => (
              <Space>
                <Button size="small" onClick={() => incDec(row, -1)}>-</Button>
                <Tag color={v <= row.min_quantity ? 'red' : 'green'}>{v}</Tag>
                <Button size="small" onClick={() => incDec(row, +1)}>+</Button>
              </Space>
            )
          },
          { title: 'Min', dataIndex: 'min_quantity', width: 90 },
          {
            title: 'Azioni',
            width: 160,
            render: (_, row) => (
              <Space>
                <Button icon={<EditOutlined />} onClick={() => openEdit(row)} />
                <Button icon={<DeleteOutlined />} danger onClick={() => onDelete(row)} />
              </Space>
            )
          }
        ]}
      />

      <Modal
        title={editing ? 'Modifica stock' : 'Nuovo stock'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={onSubmit}
        okText="Salva"
        width={720}
      >
        <Form form={form} layout="vertical" initialValues={{ quantity: 0, min_quantity: 0 }}>
          {!editing && (
            <Form.Item name="model_id" label="Modello" rules={[{ required: true }]}>
              <Select showSearch optionFilterProp="label"
                options={(models.data?.data || []).map(m => ({ value: m.id, label: `${m.brand || ''} ${m.model_name}` }))} />
            </Form.Item>
          )}
          <Row gutter={12}>
            <Col span={12}><Form.Item name="variant_label" label="Variante (es. 12.5kg)"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="location_id" label="Location ID"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="quantity" label="Quantità" rules={[{ type: 'number', min: 0 }]}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="min_quantity" label="Soglia min." rules={[{ type: 'number', min: 0 }]}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
          </Row>

          <Form.List name="specs">
            {(fields, { add, remove }) => (
              <Card size="small" title="Specifiche variante" extra={<Button onClick={() => add()} type="dashed">Aggiungi</Button>}>
                {fields.map((f) => (
                  <Row gutter={8} key={f.key} style={{ marginBottom: 8 }}>
                    <Col span={10}><Form.Item name={[f.name, 'spec_key']} rules={[{ required: true }]}><Input placeholder="es. weight_kg" /></Form.Item></Col>
                    <Col span={10}><Form.Item name={[f.name, 'spec_value']} rules={[{ required: true }]}><Input placeholder="es. 12.5" /></Form.Item></Col>
                    <Col span={4}><Button danger onClick={() => remove(f.name)} block>Rimuovi</Button></Col>
                  </Row>
                ))}
              </Card>
            )}
          </Form.List>
        </Form>
      </Modal>
    </Card>
  );
}

/* ============================
 * PAGE WRAPPER
 * ============================ */
export default function EquipmentPage() {
  return (
    <Tabs
      defaultActiveKey="models"
      items={[
        { key: 'categories', label: 'Categorie', children: <CategoriesTab /> },
        { key: 'models', label: 'Modelli', children: <ModelsTab /> },
        { key: 'assets', label: 'Asset', children: <AssetsTab /> },
        { key: 'stock', label: 'Stock', children: <StockTab /> },
      ]}
    />
  );
}
