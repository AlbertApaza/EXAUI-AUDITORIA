import React, { useState } from 'react';
import { Form, Input, Button, Alert, Card, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Login = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const onFinish = (values) => {
    const { username, password } = values;
    
    setLoading(true);
    setError('');
    
    setTimeout(() => {
      if (username === 'auditor' && password === '12345') {
        setLoading(false);
        if (onLoginSuccess) {
          onLoginSuccess({ success: true, user: { name: 'Auditor Externo' } });
        }
      } else {
        setLoading(false);
        setError('Credenciales inválidas. Intente con "auditor" y "12345".');
      }
    }, 500);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>Sistema de Auditoría de Riesgos</Title>
          <p>Ingresa tus credenciales para acceder</p>
        </div>
        
        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
        
        <Form name="login" initialValues={{ remember: true }} onFinish={onFinish} layout="vertical">
          <Form.Item name="username" rules={[{ required: true, message: 'Por favor ingresa tu nombre de usuario' }]}>
            <Input prefix={<UserOutlined />} placeholder="Usuario" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Por favor ingresa tu contraseña' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Contraseña" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Iniciar Sesión
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            <p>Usuario de prueba: auditor</p>
            <p>Contraseña: 12345</p>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;