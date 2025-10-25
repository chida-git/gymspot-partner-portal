import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Space,
  Card,
  Select,
  Typography,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  listExtras,
  createExtra,
  updateExtra,
  deleteExtra,
  getGymExtras,
  setGymExtras
} from "../services/api";
import GymHeader from '../components/GymHeader.jsx';
import { useAuth } from '../context/AuthContext'; // supponendo esista

const { Option } = Select;
const { Title, Text } = Typography;

function resolveGymId(propGymId) {
  const { user } = useAuth(); 
  return user?.gymId ?? 1;
}

const ExtrasPage = ({ gymId: gymIdProp }) => {
  const gymId = useMemo(() => resolveGymId(gymIdProp), [gymIdProp]);
  const [extras, setExtras] = useState([]);
  const [gymExtras, setGymExtrasState] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  // ---- LOADERS -------------------------------------------------------------
  const loadAll = async () => {
    setLoading(true);
    try {
      const [all, gx] = await Promise.all([listExtras(), getGymExtras(gymId)]);
      setExtras(all?.data || []);
      setGymExtrasState(gx?.data || []);
    } catch (e) {
      console.error(e);
      message.error("Errore nel caricamento degli extra");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [gymId]);

  // ---- CRUD EXTRAS ---------------------------------------------------------
  const onSaveExtra = async (values) => {
    try {
      if (editing) {
        await updateExtra(editing.id, values);
        message.success("Extra aggiornato");
      } else {
        await createExtra(values);
        message.success("Extra creato");
      }
      setModalVisible(false);
      setEditing(null);
      form.resetFields();
      const all = await listExtras();
      setExtras(all?.data || []);
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        (editing ? "Errore aggiornamento" : "Errore creazione");
      message.error(msg);
    }
  };

  const onDeleteExtra = async (id) => {
    try {
      await deleteExtra(id);
      message.success("Extra eliminato");
      await loadAll();
    } catch (e) {
      message.error("Errore eliminazione");
    }
  };

  // ---- ASSOCIAZIONI GYM <-> EXTRAS ----------------------------------------
  const selectedIds = useMemo(() => gymExtras.map((e) => e.id), [gymExtras]);

  const onAssign = async (ids) => {
    try {
      await setGymExtras(gymId, ids);
      const gx = await getGymExtras(gymId);
      setGymExtrasState(gx?.data || []);
      message.success("Extra della palestra aggiornati");
    } catch (e) {
      message.error("Errore durante l'assegnazione");
    }
  };

  // ---- TABLE ---------------------------------------------------------------
  const columns = [
    {
      title: "Nome",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Descrizione",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    // {
    //   title: "Azioni",
    //   key: "actions",
    //   width: 140,
    //   render: (_, record) => (
    //     <Space>
    //       <Button
    //         size="small"
    //         icon={<EditOutlined />}
    //         onClick={() => {
    //           setEditing(record);
    //           form.setFieldsValue({
    //             name: record.name,
    //             description: record.description,
    //           });
    //           setModalVisible(true);
    //         }}
    //       />
    //       <Popconfirm
    //         title="Eliminare questo extra?"
    //         okText="Sì"
    //         cancelText="No"
    //         onConfirm={() => onDeleteExtra(record.id)}
    //       >
    //         <Button size="small" icon={<DeleteOutlined />} danger />
    //       </Popconfirm>
    //     </Space>
    //   ),
    // },
  ];

  return (
    <div>
    <GymHeader gymId={gymId} />
    <div>
      <Card
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              Gestione Extra
            </Title>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadAll}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              Nuovo Extra
            </Button>
          </Space>
        }
      >
        <Table
          size="middle"
          dataSource={extras}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Divider />

      <Card title="Extra associati alla palestra">
        <Select
          mode="multiple"
          style={{ width: "100%" }}
          placeholder="Seleziona extra"
          value={selectedIds}
          onChange={onAssign}
          optionFilterProp="children"
        >
          {extras.map((e) => (
            <Option key={e.id} value={e.id}>
              {e.name}
            </Option>
          ))}
        </Select>

        <div style={{ marginTop: 12 }}>
          <Text type="secondary">
            Seleziona o deseleziona gli extra per aggiornare l’associazione.
          </Text>
        </div>
      </Card>

      <Modal
        open={modalVisible}
        title={editing ? "Modifica Extra" : "Nuovo Extra"}
        okText="Salva"
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false);
          setEditing(null);
        }}
        destroyOnClose
      >
        <Form layout="vertical" form={form} onFinish={onSaveExtra}>
          <Form.Item
            name="name"
            label="Nome"
            rules={[{ required: true, message: "Inserisci il nome" }]}
          >
            <Input placeholder="Es. Sauna" autoFocus />
          </Form.Item>
          <Form.Item name="description" label="Descrizione">
            <Input.TextArea placeholder="Descrizione opzionale" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
    </div>
  );
};

export default ExtrasPage;
