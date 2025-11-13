import { useState, useEffect } from 'react';
import { Card, Button, message, Image, Upload, Tabs } from 'antd';
import { SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { getEventConfig } from '../services/api';

const EventConfig = () => {
  const [eventImage, setEventImage] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [mainFileList, setMainFileList] = useState([]);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await getEventConfig();
      setEventImage(response.data.event_image || '');
      setMainImage(response.data.main_image || '');
    } catch (error) {
      message.error('Erro ao carregar configuração');
    }
  };

  const handleUpload = () => false;

  const handleChange = ({ fileList }) => {
    setFileList(fileList);
    if (fileList.length > 0) {
      const file = fileList[0].originFileObj;
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setEventImage(e.target.result);
          message.success('Imagem carregada! Clique em Salvar.');
        };
        reader.readAsDataURL(file);
      }
    } else {
      setEventImage('');
    }
  };

  const handleSave = async () => {
    if (!fileList.length || !fileList[0].originFileObj) {
      message.warning('Selecione uma imagem primeiro');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj);
      const { default: api } = await import('../services/api');
      const response = await api.post('/event-config/upload', formData);
      setEventImage(response.data.event_image);
      message.success('Imagem do mapa salva!');
      setFileList([]);
    } catch (error) {
      message.error(error?.response?.data?.error || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const handleMainChange = ({ fileList }) => {
    setMainFileList(fileList);
    if (fileList.length > 0) {
      const file = fileList[0].originFileObj;
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setMainImage(e.target.result);
          message.success('Imagem carregada! Clique em Salvar.');
        };
        reader.readAsDataURL(file);
      }
    } else {
      setMainImage('');
    }
  };

  const handleMainSave = async () => {
    if (!mainFileList.length || !mainFileList[0].originFileObj) {
      message.warning('Selecione uma imagem primeiro');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', mainFileList[0].originFileObj);
      const { default: api } = await import('../services/api');
      const response = await api.post('/event-config/upload-main', formData);
      setMainImage(response.data.main_image);
      message.success('Imagem principal salva!');
      setMainFileList([]);
    } catch (error) {
      message.error(error?.response?.data?.error || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title='Configuração do Evento'>
      <Tabs
        defaultActiveKey='1'
        items={[
          {
            key: '1',
            label: 'Imagem Principal (Home)',
            children: (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>
                    Imagem exibida na tela inicial do usuário
                  </label>
                  <Upload
                    beforeUpload={handleUpload}
                    fileList={mainFileList}
                    onChange={handleMainChange}
                    maxCount={1}
                    accept='image/*'
                    listType='picture'
                  >
                    <Button icon={<UploadOutlined />}>Selecionar Imagem</Button>
                  </Upload>
                  <Button
                    type='primary'
                    icon={<SaveOutlined />}
                    onClick={handleMainSave}
                    loading={loading}
                    style={{ marginTop: 16 }}
                    disabled={!mainImage}
                  >
                    Salvar
                  </Button>
                </div>
                {mainImage && (
                  <div style={{ marginTop: 24 }}>
                    <h3>Prévia:</h3>
                    <Image
                      src={mainImage}
                      alt='Imagem Principal'
                      style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }}
                    />
                  </div>
                )}
              </div>
            ),
          },
          {
            key: '2',
            label: 'Imagem do Mapa',
            children: (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>
                    Imagem de fundo do mapa de mesas
                  </label>
                  <Upload
                    beforeUpload={handleUpload}
                    fileList={fileList}
                    onChange={handleChange}
                    maxCount={1}
                    accept='image/*'
                    listType='picture'
                  >
                    <Button icon={<UploadOutlined />}>Selecionar Imagem</Button>
                  </Upload>
                  <Button
                    type='primary'
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    loading={loading}
                    style={{ marginTop: 16 }}
                    disabled={!eventImage}
                  >
                    Salvar
                  </Button>
                </div>
                {eventImage && (
                  <div style={{ marginTop: 24 }}>
                    <h3>Prévia:</h3>
                    <Image
                      src={eventImage}
                      alt='Imagem do Mapa'
                      style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }}
                    />
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </Card>
  );
};

export default EventConfig;
