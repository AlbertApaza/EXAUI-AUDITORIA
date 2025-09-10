import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button, Form, Input, Popconfirm, Table, Modal, Layout, Typography, message } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios'; // Asegúrate de que axios esté importado
import Login from './components/Login'; // Importamos el login

// --- INICIO DE MODIFICACIONES DE AUTENTICACIÓN ---
// Ya no importamos desde LoginService, la lógica será local.
// import { isAuthenticated, logout } from './services/LoginService'; 
// --- FIN DE MODIFICACIONES DE AUTENTICACIÓN ---

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const EditableContext = React.createContext(null);

// El código de EditableRow y EditableCell no necesita cambios, lo dejamos como está.
const EditableRow = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

const EditableCell = ({ title, editable, children, dataIndex, record, handleSave, ...restProps }) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  const form = useContext(EditableContext);
  useEffect(() => { if (editing) { inputRef.current.focus(); } }, [editing]);
  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };
  const save = async () => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };
  let childNode = children;
  if (editable) {
    childNode = editing ? (
      <Form.Item style={{ margin: 0 }} name={dataIndex} rules={[{ required: true, message: `${title} es requerido.` }]}>
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <div className="editable-cell-value-wrap" style={{ paddingRight: 24 }} onClick={toggleEdit}>
        {children}
      </div>
    );
  }
  return <td {...restProps}>{childNode}</td>;
};


// --- Componente Principal App ---
const App = () => {
  // --- INICIO DE MODIFICACIONES DE AUTENTICACIÓN ---
  // 1. El estado de autenticación empieza en 'false'. No revisamos localStorage.
  const [authenticated, setAuthenticated] = useState(false);
  // Guardamos el nombre del usuario para mostrarlo en el header.
  const [currentUser, setCurrentUser] = useState('');
  
  // 2. Esta función es llamada por Login.jsx cuando las credenciales ficticias son correctas.
  const handleLoginSuccess = (response) => {
    setAuthenticated(true);
    // Usamos el nombre del usuario que pasamos desde Login.jsx
    setCurrentUser(response.user.name); 
    message.success(`¡Bienvenido, ${response.user.name}!`);
  };
  
  // 3. El logout ahora es local. Simplemente cambia el estado a 'false'.
  const handleLogout = () => {
    setAuthenticated(false);
    setCurrentUser('');
    message.info('Sesión cerrada correctamente');
  };
  // --- FIN DE MODIFICACIONES DE AUTENTICACIÓN ---
  
  // El resto de los estados de la aplicación se mantienen
  const [isLoading, setIsLoading] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [count, setCount] = useState(1);
  const [newData, setNewData] = useState({ activo: '' });

  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => setIsModalVisible(false);
  
  const handleDelete = (key) => {
    const newData = dataSource.filter((item) => item.key !== key);
    setDataSource(newData);
  };

  // --- INICIO DE MODIFICACIÓN: CONEXIÓN REAL CON LA IA ---
  // Reemplazamos la función 'handleOk' con una que llama al backend de Flask.
  // --- INICIO DE MODIFICACIÓN FINAL: CONEXIÓN REAL CON LAS RUTAS CORRECTAS DE LA IA ---
const handleAnalizarActivo = async () => {
  if (!newData.activo.trim()) {
    message.error('Por favor ingresa un nombre de activo');
    return;
  }

  setIsLoading(true);
  
  try {
    // 1. PRIMERA LLAMADA: Obtenemos una lista de riesgos e impactos
    const responseRiesgos = await axios.post('http://127.0.0.1:5500/analizar-riesgos', {
      activo: newData.activo
    });

    const { riesgos, impactos } = responseRiesgos.data;

    // Si la IA no devuelve riesgos, detenemos el proceso.
    if (!riesgos || riesgos.length === 0) {
      message.warning('La IA no pudo identificar riesgos para este activo.');
      setIsLoading(false);
      return;
    }

    // 2. SEGUNDA LLAMADA: Tomamos el primer riesgo e impacto y pedimos un tratamiento
    const primerRiesgo = riesgos[0];
    const primerImpacto = impactos[0];

    const responseTratamiento = await axios.post('http://127.0.0.1:5500/sugerir-tratamiento', {
      activo: newData.activo,
      riesgo: primerRiesgo,
      impacto: primerImpacto
    });

    const { tratamiento } = responseTratamiento.data;

    // 3. Agregamos la fila a la tabla con toda la información
    addNewRow(newData.activo, primerRiesgo, primerImpacto, tratamiento);
    
    setIsModalVisible(false);
    message.success(`Activo "${newData.activo}" analizado y agregado con éxito`);

  } catch (error) {
    console.error("Error al analizar el activo:", error);
    message.error('Error al conectar con el motor de IA. Revisa la consola del backend.');
  } finally {
    setIsLoading(false);
  }
};
// --- FIN DE MODIFICACIÓN FINAL ---

  const addNewRow = (activo, riesgo, impacto, tratamiento) => {
    const newRow = {
      key: `${count}`,
      activo,
      riesgo,
      impacto,
      tratamiento
    };
    setDataSource([...dataSource, newRow]);
    setCount(count + 1);
    setNewData({ activo: '' }); // Limpiamos el input
  };
  // --- FIN DE MODIFICACIÓN: CONEXIÓN REAL CON LA IA ---

  const handleSave = (row) => {
    const newData = [...dataSource];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, { ...item, ...row });
    setDataSource(newData);
  };

  const defaultColumns = [
    { title: 'Activo', dataIndex: 'activo', width: '15%', editable: true },
    { title: 'Riesgo', dataIndex: 'riesgo', width: '20%', editable: true },
    { title: 'Impacto', dataIndex: 'impacto', width: '30%', editable: true },
    { title: 'Tratamiento (ISO 27001)', dataIndex: 'tratamiento', width: '30%', editable: true },
    {
      title: 'Operación',
      dataIndex: 'operation',
      render: (_, record) => (
        <Popconfirm title="¿Seguro que quieres eliminar?" onConfirm={() => handleDelete(record.key)}>
          <a>Eliminar</a>
        </Popconfirm>
      ),
    },
  ];

  const components = { body: { row: EditableRow, cell: EditableCell } };
  const columns = defaultColumns.map((col) => {
    if (!col.editable) { return col; }
    return { ...col, onCell: (record) => ({ record, editable: col.editable, dataIndex: col.dataIndex, title: col.title, handleSave }) };
  });

  // --- LÓGICA DE RENDERIZADO CONDICIONAL ---
  // Si no está autenticado, muestra el componente Login.
  if (!authenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }
  
  // Si está autenticado, muestra la aplicación completa.
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ color: 'white', margin: 0 }}>Sistema de Auditoría de Riesgos</Title>
        <div>
          <Text style={{ color: 'white', marginRight: 16 }}>
            <UserOutlined /> {currentUser}
          </Text>
          <Button type="link" icon={<LogoutOutlined />} onClick={handleLogout} style={{ color: 'white' }}>
            Cerrar Sesión
          </Button>
        </div>
      </Header>
      
      <Content style={{ padding: '24px', background: '#fff' }}>
        <div>
          <Button onClick={showModal} type="primary" style={{ marginBottom: 16 }}>
            + Analizar Activo
          </Button>
          
          <Modal
            title="Analizar Nuevo Activo con IA"
            visible={isModalVisible}
            onOk={handleAnalizarActivo} // Cambiado a la nueva función
            onCancel={handleCancel}
            okText="Analizar y Agregar"
            cancelText="Cancelar"
            confirmLoading={isLoading}
          >
            <Form layout="vertical">
              <Form.Item label="Nombre del Activo" rules={[{ required: true }]}>
                <Input 
                  value={newData.activo} 
                  onChange={(e) => setNewData({ ...newData, activo: e.target.value })}
                  placeholder="Ej: Servidor de base de datos" 
                />
              </Form.Item>
            </Form>
          </Modal>

          <Table
            components={components}
            rowClassName={() => 'editable-row'}
            bordered
            dataSource={dataSource}
            columns={columns}
            pagination={{ pageSize: 5 }}
          />
        </div>
      </Content>
      
      <Footer style={{ textAlign: 'center' }}>
        Sistema de Auditoría de Riesgos ©{new Date().getFullYear()}
      </Footer>
    </Layout>
  );
};

export default App;